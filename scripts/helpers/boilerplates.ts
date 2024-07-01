import { existsSync } from "node:fs";
import { opendir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __boilerplates = resolve(__dirname, "..", "..", "boilerplates");

export async function* walk(dir: string, maxDepth = Infinity): AsyncGenerator<string> {
  if (maxDepth < 0 || !existsSync(dir)) return;
  for await (const d of await opendir(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) {
      yield* walk(entry, maxDepth - 1);
    } else if (d.isFile()) yield entry;
  }
}

export async function* listBoilerplates(): AsyncGenerator<string> {
  const gen = walk(__boilerplates, 1);

  for await (const filepath of gen) {
    if (filepath.endsWith("package.json")) {
      const content = JSON.parse(await readFile(filepath, "utf-8"));

      yield content.name;
    }
  }
}
