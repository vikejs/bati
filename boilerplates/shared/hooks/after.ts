import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { VikeMeta } from "@batijs/core";

async function cleanupMarkdown(cwd: string, filename: `${string}.md`) {
  const content = await readFile(join(cwd, filename), "utf8");
  const trimmed = content
    .replaceAll(/<!--bati:.*-->/g, "")
    .replaceAll(/\n\n+/g, "\n\n")
    .trimStart();
  await writeFile(join(cwd, filename), trimmed, "utf-8");
  return trimmed;
}

// Rename gitignore after the fact to prevent npm from renaming it to .npmignore
// See: https://github.com/npm/npm/issues/1862
async function renameGitIgnore(cwd: string) {
  await rename(join(cwd, "gitignore"), join(cwd, ".gitignore"));
}

export default async function onafter(cwd: string, _meta: VikeMeta) {
  await cleanupMarkdown(cwd, "README.md");
  const content = await cleanupMarkdown(cwd, "TODO.md");
  // Remove empty TODO.md
  if (content.trim() === "The following steps need to be performed before starting your application.") {
    await unlink(join(cwd, "TODO.md"));
  }
  await renameGitIgnore(cwd);
}
