import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { VikeMeta } from "@batijs/core";

async function cleanupReadme(cwd: string) {
  const content = await readFile(join(cwd, "README.md"), "utf8");
  await writeFile(
    join(cwd, "README.md"),
    content
      .replaceAll(/<!--bati:.*-->/g, "")
      .replaceAll(/\n\n+/g, "\n\n")
      .trimStart(),
    "utf-8",
  );
}

// Rename gitignore after the fact to prevent npm from renaming it to .npmignore
// See: https://github.com/npm/npm/issues/1862
async function renameGitIgnore(cwd: string) {
  await rename(join(cwd, "gitignore"), join(cwd, ".gitignore"));
}

export default async function onafter(cwd: string, _meta: VikeMeta) {
  await cleanupReadme(cwd);
  await renameGitIgnore(cwd);
}
