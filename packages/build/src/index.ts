import { existsSync } from "node:fs";
import { mkdir, opendir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { type VikeMeta } from "@batijs/core";
import type { FileOperation, OperationReport } from "./operations/common.js";
import { executeOperationFile } from "./operations/file.js";
import { executeOperationTransform } from "./operations/transform.js";
import { OperationsRearranger } from "./operations/rearranger.js";

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

async function safeRmFile(destination: string) {
  try {
    await rm(destination, {
      force: true,
      maxRetries: 3,
      recursive: false,
      retryDelay: 150,
    });
  } catch {
    console.warn(`Failed to remove unecessary file: ${destination}`);
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

function importToPotentialTargets(imp: string) {
  let subject = imp;
  const ext = path.extname(imp);
  const targets: string[] = [];

  if (ext.match(/^\.[jt]sx?$/)) {
    subject = subject.replace(/^\.[jt]sx?$/, "");
  }

  if (!ext || subject !== imp) {
    targets.push(...[".js", ".jsx", ".ts", ".tsx", ".cjs", ".mjs"].map((e) => `${subject}${e}`));
  } else {
    targets.push(imp);
  }

  return targets;
}

export default async function main(options: { source: string | string[]; dist: string }, meta: VikeMeta) {
  const sources = Array.isArray(options.source) ? options.source : [options.source];
  const allImports = new Set<string>();
  const filesContainingIncludeIfImported = new Set<string>();

  function updateAllImports(target: string, imports?: Set<string>) {
    if (!imports) return;

    for (const imp of imports.values()) {
      const importTarget = path.resolve(path.dirname(target), imp);
      const importTargets = importToPotentialTargets(importTarget);

      for (const imp2 of importTargets) {
        allImports.add(imp2);
      }
    }
  }

  const rearranger = new OperationsRearranger();

  for (const source of sources) {
    for await (const p of walk(source)) {
      const target = toDist(p, source, options.dist);
      const targetAbsolute = path.isAbsolute(target) ? target : path.resolve(target);
      const parsed = path.parse(p);
      if (parsed.name.match(reIgnoreFile)) {
        continue;
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

  let previousOp: (FileOperation & OperationReport) | undefined = undefined;
  for (const op of rearranger.compute()) {
    if (previousOp?.destination !== op.destination) {
      previousOp = undefined;
    }
    let report: OperationReport = {};
    if (op.kind === "file") {
      report = await executeOperationFile(op, {
        meta,
        previousOperationSameDestination: previousOp,
      });

      updateAllImports(op.destinationAbsolute, report.context?.imports);
    } else if (op.kind === "transform") {
      report = await executeOperationTransform(op, {
        meta,
        previousOperationSameDestination: previousOp,
      });
    }

    if (report.content) {
      await safeWriteFile(op.destination, report.content.trimStart());
    }

    previousOp = {
      ...op,
      ...report,
    };
  }

  // Remove "include-if-imported" files if they are not imported by any other file
  for (const target of filesContainingIncludeIfImported) {
    if (!allImports.has(target)) {
      await safeRmFile(target);
    }
  }
}
