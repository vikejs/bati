import { existsSync } from "node:fs";
import { copyFile, mkdir, opendir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadFile, renderSquirrelly, transformAstAndGenerate, type Transformer, type VikeMeta } from "@batijs/core";
import { queue } from "./queue.js";

const reIgnoreFile = /^(chunk-|asset-|#)/gi;
const isWin = process.platform === "win32";

function toDist(filepath: string, source: string, dist: string) {
  const split = filepath.split(path.sep);
  split[split.length - 1] = split[split.length - 1].replace(/^\$\$?(.*)\.[tj]sx?$/, "$1");
  return split.join(path.sep).replace(source, dist);
}

async function safeCopyFile(source: string, destination: string) {
  const destinationDir = path.dirname(destination);
  await mkdir(destinationDir, {
    recursive: true,
  });
  await copyFile(source, destination);
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
  const ext = parsed.ext || parsed.name;
  switch (ext) {
    case ".ts":
    case ".js":
    case ".tsx":
    case ".jsx":
    case ".env":
    case ".html":
      return fileContent as string;
    case ".json":
      return JSON.stringify(fileContent, null, 2);
    default:
      throw new Error(`Unsupported extension ${ext} (${filepath})`);
  }
}

async function fileContainsBatiMeta(filepath: string) {
  const code = await readFile(filepath, { encoding: "utf-8" });
  return code.includes("import.meta.BATI_");
}

async function importTransformer(p: string) {
  const importFile = isWin ? "file://" + p : p;
  const f = await import(importFile);

  return f.default as Transformer;
}

export default async function main(options: { source: string | string[]; dist: string }, meta: VikeMeta) {
  const sources = Array.isArray(options.source) ? options.source : [options.source];
  const targets = new Set<string>();

  const simpleCopyQ = queue();
  const transformAndWriteQ = queue();

  for (const source of sources) {
    for await (const p of walk(source)) {
      const target = toDist(p, source, options.dist);
      const parsed = path.parse(p);
      if (parsed.name.match(reIgnoreFile)) {
        continue;
      } else if (parsed.name.startsWith("$") && parsed.ext.match(/\.tsx?$/)) {
        throw new Error(
          `Typescript file needs to be compiled before it can be executed: '${p}'.
Please report this issue to https://github.com/magne4000/bati`,
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
            targets.add(target);
          }
        });
      } else if (await fileContainsBatiMeta(p)) {
        transformAndWriteQ.add(async () => {
          let fileContent = "";
          if (parsed.ext.match(/\.[tj]sx?$/)) {
            // We use magicast/recast to transform the file. Only supports javascript and typescript. Vue SFC files are
            // not supported yet, see https://github.com/benjamn/recast/issues/842
            const mod = await loadFile(p);
            fileContent = await transformAstAndGenerate(mod.$ast, meta, {
              filepath: p,
            });
          } else {
            // We use SquirrellyJS to transform the file.
            const template = await readFile(p, { encoding: "utf-8" });
            try {
              fileContent = renderSquirrelly(template, meta);
            } catch (e) {
              console.error("SquirrellyJS error while rendering", p);
              throw e;
            }
          }

          if (fileContent) {
            await safeWriteFile(target, fileContent);
            targets.add(target);
          }
        });
      } else {
        simpleCopyQ.add(async () => {
          // simple copy
          await safeCopyFile(p, target);
          targets.add(target);
        });
      }
    }
  }

  // files that do not need transformation are handled first, so that subsequent transform steps
  // are sure to have necessary files on filesystem.
  await simpleCopyQ.run();
  await transformAndWriteQ.run();
}
