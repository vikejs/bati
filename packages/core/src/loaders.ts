import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFile, parseModule, type ProxifiedModule } from "magicast";
import { assert } from "./assert.js";
import { parseReadme } from "./markdown.js";
import type { TransformerProps } from "./types.js";

export async function loadReadme({ readfile }: TransformerProps) {
  const content = await readfile?.();

  return parseReadme(content);
}

export async function loadAsJson({ readfile, source, target }: TransformerProps) {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous JSON module ("${source}" -> "${target}")`);

  return JSON.parse(content);
}

export async function loadAsMagicast<Exports extends object>({
  readfile,
  source,
  target,
}: TransformerProps): Promise<ProxifiedModule<Exports>> {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous module ("${source}" -> "${target}")`);

  return parseModule(content);
}

export async function loadRelativeFileAsMagicast<Exports extends object>(
  relativePath: string,
  meta: Pick<ImportMeta, "url">,
): Promise<ProxifiedModule<Exports>> {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);

  return loadFile(join(__dirname, relativePath));
}
