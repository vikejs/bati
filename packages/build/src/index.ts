import { existsSync } from "node:fs";
import { mkdir, opendir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { transformAndFormat, type Transformer, type VikeMeta } from "@batijs/core";
import { mergeDts } from "./merge-dts.js";
import { queue } from "./queue.js";

const reIgnoreFile = /^(chunk-|asset-|#)/gi;
const isWin = process.platform === "win32";

function toDist(filepath: string, source: string, dist: string) {
  const split = filepath.split(path.sep);
  split[split.length - 1] = split[split.length - 1].replace(/^\$\$?(.*)\.[tj]sx?$/, "$1");
  return split.join(path.sep).replace(source, dist);
}

async function safeWriteFile(destination: string, content: string) {
  const destinationDir = path.dirname(destination);
  await mkdir(destinationDir, {
    recursive: true,
  });
  await writeFile(destination, content, { encoding: "utf-8" });
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

function transformFileAfterExec(filepath: string, fileContent: unknown): string | null {
  if (fileContent === undefined || fileContent === null) return null;
  const parsed = path.parse(filepath);
  const toTest = [parsed.base, parsed.ext, parsed.name].filter(Boolean);

  for (const ext of toTest) {
    switch (ext) {
      case ".ts":
      case ".js":
      case ".tsx":
      case ".jsx":
      case ".env":
      case ".env.local":
      case ".env.development":
      case ".env.development.local":
      case ".env.test":
      case ".env.test.local":
      case ".env.production":
      case ".env.production.local":
      case ".html":
      case ".md":
        return fileContent as string;
      case ".json":
        return JSON.stringify(fileContent, null, 2);
    }
  }
  throw new Error(`Unsupported file extension ${parsed.base} (${filepath})`);
}

async function importTransformer(p: string) {
  const importFile = isWin ? "file://" + p : p;
  const f = await import(importFile);

  return f.default as Transformer;
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
  const targets = new Set<string>();
  const allImports = new Set<string>();
  const includeIfImported = new Map<string, () => Promise<void>>();

  const priorityQ = queue();
  const transformAndWriteQ = queue();

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

  async function triggerPendingTargets(target: string, imports?: Set<string>) {
    if (!imports) return;

    for (const imp of imports.values()) {
      const importTarget = path.resolve(path.dirname(target), imp);
      const importTargets = importToPotentialTargets(importTarget);

      for (const imp2 of importTargets) {
        if (includeIfImported.has(imp2)) {
          const fn = includeIfImported.get(imp2)!;
          includeIfImported.delete(imp2);
          await fn();
          break;
        }
      }
    }
  }

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
Please report this issue to https://github.com/batijs/bati`,
        );
      } else if (parsed.name.startsWith("$") && parsed.ext.match(/\.jsx?$/)) {
        transformAndWriteQ.add(async () => {
          const transformer = await importTransformer(p);

          const rf = () => {
            return readFile(target, { encoding: "utf-8" });
          };

          const fileContent = transformFileAfterExec(
            target,
            await transformer({
              readfile: targets.has(target) ? rf : undefined,
              meta,
              source,
              target,
            }),
          );

          if (fileContent !== null) {
            await safeWriteFile(target, fileContent);
          }
        });
      } else {
        priorityQ.add(async () => {
          const code = await readFile(p, { encoding: "utf-8" });
          const filepath = path.relative(source, p);

          const result = await transformAndFormat(code, meta, {
            filepath,
          });

          let fileContent = result.code;

          if (p.endsWith(".d.ts") && targets.has(target)) {
            // Merging .d.ts files here
            fileContent = await mergeDts({
              fileContent,
              target,
              meta,
              filepath,
            });
          }

          if (fileContent) {
            updateAllImports(targetAbsolute, result.context?.imports);
            if (!result.context?.flags.has("include-if-imported") || allImports.has(targetAbsolute)) {
              await safeWriteFile(target, fileContent.trimStart());
              await triggerPendingTargets(targetAbsolute, result.context?.imports);
            } else {
              includeIfImported.set(targetAbsolute, () => safeWriteFile(target, fileContent.trimStart()));
            }
            targets.add(target);
          }
        });
      }
    }
  }

  await priorityQ.run();
  await transformAndWriteQ.run();

  // Ensure all pending files are copied if necessary
  for (const target of includeIfImported.keys()) {
    if (allImports.has(target)) {
      await includeIfImported.get(target)!();
    }
  }
}
