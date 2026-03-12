import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { VikeMeta } from "@batijs/core";
import { packageManager } from "@batijs/core";

export default async function onafter(cwd: string, meta: VikeMeta) {
  const isInteractive = !meta.BATI_IS_CI && !meta.BATI_TEST;
  const pm = packageManager();
  const command = `${pm.exec} storybook@latest init --skip-install --no-dev${isInteractive ? "" : " --yes"}`;
  execSync(command, { cwd, stdio: "inherit" });

  if (!isInteractive && meta.BATI.has("solid")) {
    // SolidJS typings are not correct
    await replaceInFile(
      join(cwd, "stories/Page.stories.ts"),
      "type Story = StoryObj<typeof meta>;",
      "type Story = StoryObj<Omit<typeof meta, 'component'>>;",
    );
  }
}

async function replaceInFile(path: string, searchValue: string, replaceValue: string) {
  let content = await readFile(path, "utf8");
  content = content.replace(searchValue, replaceValue);
  await writeFile(path, content, "utf8");
}
