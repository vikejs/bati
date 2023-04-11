import {
  readFile,
  opendir,
  copyFile,
  mkdir,
  writeFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import { ast, transform } from "./parse";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __files = path.resolve(__dirname, "..", "files");

function evalDirCondition(obj: string, meta: VikeMeta) {
  obj = obj.replaceAll("VIKE_", "VIKE_META.VIKE_");
  obj = `var VIKE_META = ${JSON.stringify(meta)};(${obj})`;

  return (0, eval)(obj);
}

function shouldWalkDir(dirname: string, meta: VikeMeta) {
  if (!dirname.includes("VIKE_")) return true;

  return evalDirCondition(dirname, meta);
}

function toDist(filepath: string, dist: string) {
  const split = filepath.split(path.sep).filter((p) => !p.includes("VIKE_"));
  split[split.length - 1] = split[split.length - 1].replace(
    /^\$(.*)\.ts$/,
    "$1"
  );
  return split.join(path.sep).replace(__files, dist);
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

async function* walk(dir: string, meta: VikeMeta): AsyncGenerator<string> {
  for await (const d of await opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (shouldWalkDir(d.name, meta)) {
        yield* walk(entry, meta);
      }
    } else if (d.isFile()) yield entry;
  }
}

function transformFileAfterExec(
  filepath: string,
  fileContent: unknown
): string {
  const parsed = path.parse(filepath);
  switch (parsed.ext) {
    case ".json":
      return JSON.stringify(fileContent, null, 2);
    default:
      throw new Error(`Unsupported extension ${parsed.ext} (${filepath})`);
  }
}

export default async function main(options: { dist: string }, meta: VikeMeta) {
  for await (const p of walk(__files, meta)) {
    const target = toDist(p, options.dist);
    if (p.match(/\.[tj]sx?$/)) {
      // transform
      let code: string;
      try {
        const tree = ast(await readFile(p, { encoding: "utf8" }));
        code = transform(tree, meta);
      } catch (e) {
        console.error(`File: ${p}`);
        throw e;
      }

      const parsed = path.parse(p);

      if (parsed.name.startsWith("$")) {
        // create a temp file, import it, and exec its default import
        const tmpfile = path.join(
          parsed.dir,
          `${parsed.name}.${new Date().toISOString().replaceAll(":", "-")}${
            parsed.ext
          }`
        );

        let fileContent: string | null = null;

        try {
          await writeFile(tmpfile, code, { encoding: "utf-8" });

          const f = await import(tmpfile);

          fileContent = transformFileAfterExec(target, await f.default());
        } finally {
          await unlink(tmpfile);
        }

        if (fileContent !== null) {
          await safeWriteFile(target, fileContent);
        }
      } else {
        await safeWriteFile(target, code);
      }
    } else {
      // simple copy
      await safeCopyFile(p, target);
    }
  }
}
