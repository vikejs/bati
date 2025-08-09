import { existsSync } from "node:fs";
import { mkdir, opendir, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PackageJson, VikeMeta } from "@batijs/core";
import type { FileOperation, OperationReport } from "./operations/common.js";
import { executeOperationFile } from "./operations/file.js";
import { OperationsRearranger } from "./operations/rearranger.js";
import { executeOperationTransform } from "./operations/transform.js";
import { RelationFile, RelationImport } from "./relations.js";

const reIgnoreFile = /^(chunk-|asset-|#)/gi;

function toDist(filepath: string, source: string, dist: string) {
  const split = filepath.split(path.sep);
  split[split.length - 1] = split[split.length - 1].replace(/^\$\$?(.*)\.[tj]sx?$/, "$1").replace(/^!(.*)$/, "$1");
  return split.join(path.sep).replace(source, dist);
}

async function safeWriteFile(destination: string, content: string) {
  const destinationDir = path.dirname(destination);
  await mkdir(destinationDir, {
    recursive: true,
  });
  await writeFile(destination, content, { encoding: "utf-8" });
}

async function safeRmFile(destination: string, options?: { removeEmptyDir?: boolean }) {
  try {
    await rm(destination, {
      force: true,
      maxRetries: 3,
      recursive: false,
      retryDelay: 150,
    });
    if (options?.removeEmptyDir) {
      try {
        await rmdir(path.dirname(destination), {
          maxRetries: 3,
          retryDelay: 150,
        });
      } catch {
        // do nothing
      }
    }
  } catch {
    console.warn(`Failed to remove unnecessary file: ${destination}`);
  }
}

export async function* walk(dir: string): AsyncGenerator<string> {
  if (!existsSync(dir)) return;
  for await (const d of await opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(entry);
    } else if (d.isFile()) yield entry;
  }
}

export default async function main(options: { source: string | string[]; dist: string }, meta: VikeMeta) {
  const sources = Array.isArray(options.source) ? options.source : [options.source];

  function updateAllImports(target: string, imports: Set<string> | undefined, includeIfImported: boolean) {
    const rf = new RelationFile(target, includeIfImported);
    if (!imports) return;

    for (const imp of imports.values()) {
      const importTarget = path.resolve(path.dirname(target), imp);
      new RelationImport(rf, importTarget);
    }
  }

  const rearranger = new OperationsRearranger();

  for (const source of sources) {
    for await (const p of walk(source)) {
      const target = toDist(p, source, options.dist);
      const targetAbsolute = path.isAbsolute(target) ? target : path.resolve(target);
      const parsed = path.parse(p);
      if (parsed.name.match(reIgnoreFile)) {
        // continue
      } else if (parsed.name.startsWith("$") && parsed.ext.match(/\.tsx?$/)) {
        throw new Error(
          `Typescript file needs to be compiled before it can be executed: '${p}'.
Please report this issue to https://github.com/vikejs/bati`,
        );
      } else if ((parsed.name.startsWith("!$") || parsed.name.startsWith("$")) && parsed.ext.match(/\.jsx?$/)) {
        rearranger.addFile({
          source,
          sourceAbsolute: p,
          destination: target,
          destinationAbsolute: targetAbsolute,
          kind: "transform",
          parsed,
          important: parsed.name.startsWith("!"),
        });
      } else {
        rearranger.addFile({
          source,
          sourceAbsolute: p,
          destination: target,
          destinationAbsolute: targetAbsolute,
          kind: "file",
          parsed,
          important: parsed.name.startsWith("!"),
        });
      }
    }
  }

  let previousOp: (FileOperation & OperationReport) | undefined;
  let previousOpContent: string | undefined;
  let packageJson: PackageJson = {};
  const packageJsonDistAbsolute = path.join(
    path.isAbsolute(options.dist) ? options.dist : path.resolve(options.dist),
    "package.json",
  );
  for (const op of rearranger.compute()) {
    if (previousOp?.destination !== op.destination) {
      previousOp = undefined;
      previousOpContent = undefined;
    }
    let report: OperationReport = {};
    if (op.kind === "file") {
      report = await executeOperationFile(op, {
        meta,
        previousOperationSameDestination: previousOp,
      });

      updateAllImports(
        op.destinationAbsolute,
        report.context?.imports,
        Boolean(report.context?.flags.has("include-if-imported")),
      );
    } else if (op.kind === "transform") {
      report = await executeOperationTransform(op, {
        meta,
        previousOperationSameDestination: previousOp,
        packageJson,
      });

      // TODO: also call updateAllImports. Needs to compute report.context.imports
    }

    if (report.content) {
      await safeWriteFile(op.destination, report.content.trimStart());

      if (op.destinationAbsolute === packageJsonDistAbsolute) {
        packageJson = JSON.parse(report.content);
      }
    }

    previousOpContent = report.content ?? previousOpContent;
    previousOp = {
      ...op,
      ...report,
      content: previousOpContent,
    };
  }

  for (const target of RelationImport.computeUnimportedFiles()) {
    await safeRmFile(target.pathAbsolute, { removeEmptyDir: true });
  }
}
