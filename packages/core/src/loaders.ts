import { loadFile, parseModule, type ProxifiedModule } from "magicast";
import type { MaybeContentGetter } from "./types.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { assert } from "./assert.js";

export async function loadAsJson(getter: MaybeContentGetter) {
  const content = await getter?.();

  assert(typeof content === "string", "Unable to load previous JSON module");

  return JSON.parse(content);
}

export async function loadAsMagicast<Exports extends object>(
  getter: MaybeContentGetter
): Promise<ProxifiedModule<Exports>> {
  const content = await getter?.();

  assert(typeof content === "string", "Unable to load previous module");

  return parseModule(content);
}

export async function loadRelativeFileAsMagicast<Exports extends object>(
  relativePath: string,
  meta: Pick<ImportMeta, "url">
): Promise<ProxifiedModule<Exports>> {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);

  return loadFile(join(__dirname, relativePath));
}
