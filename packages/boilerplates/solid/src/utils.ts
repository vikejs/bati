import sharedFilesPath from "@batijs/shared/files";
import { readFile } from "node:fs/promises";

export function getSharedFilePath(meta: ImportMeta) {
  return meta.url
    .replace(/.*bati\/packages\/boilerplates\/.+\/files/, sharedFilesPath)
    .replace(/\/\$([^/]+)\.[tj]s$/, "/$1");
}

export async function importSharedJsonFile(meta: ImportMeta) {
  const file = await readFile(getSharedFilePath(meta), "utf8");
  return JSON.parse(file);
}
