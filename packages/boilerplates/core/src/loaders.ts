import { loadFile, parseModule } from "magicast";
import type { MaybeContentGetter } from "./types";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export async function loadAsJson(getter: MaybeContentGetter) {
  const content = await getter?.();

  if (typeof content !== "string") {
    throw new Error("TODO");
  }

  return JSON.parse(content);
}

export async function loadAsMagicast(getter: MaybeContentGetter) {
  const content = await getter?.();

  if (typeof content !== "string") {
    throw new Error("TODO");
  }

  return parseModule(content);
}

export async function loadRelativeFileAsMagicast(relativePath: string, meta: Pick<ImportMeta, "url">) {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);

  return loadFile(join(__dirname, relativePath));
}
