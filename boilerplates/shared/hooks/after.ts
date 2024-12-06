import type { VikeMeta } from "@batijs/core";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

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

function renameGitIgnore() {}

export default async function onafter(cwd: string, meta: VikeMeta) {
  await cleanupReadme(cwd);
}
