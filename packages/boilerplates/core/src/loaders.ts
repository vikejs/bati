import { loadFile, parseModule, type ProxifiedModule } from "magicast";
import type { MaybeContentGetter } from "./types.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isString } from "./assert.js";

export async function loadAsJson(getter: MaybeContentGetter) {
  const content = await getter?.();

  return JSON.parse(isString(content));
}

export async function loadAsMagicast<Exports extends object>(
  getter: MaybeContentGetter
): Promise<ProxifiedModule<Exports>> {
  const content = await getter?.();

  return parseModule(isString(content));
}

export async function loadRelativeFileAsMagicast<Exports extends object>(
  relativePath: string,
  meta: Pick<ImportMeta, "url">
): Promise<ProxifiedModule<Exports>> {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);

  return loadFile(join(__dirname, relativePath));
}
