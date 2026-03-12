import { execSync } from "node:child_process";
import { packageManager } from "@batijs/core";
import type { VikeMeta } from "@batijs/core";

export default async function onafter(cwd: string, meta: VikeMeta) {
  const isInteractive = !meta.BATI_IS_CI && !meta.BATI_TEST;
  const pm = packageManager();
  const command = `${pm.exec} storybook@latest init${isInteractive ? "" : " --yes"}`;
  execSync(command, { cwd, stdio: "inherit" });
}
