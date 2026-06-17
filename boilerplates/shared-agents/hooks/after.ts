import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { HookContext, VikeMeta } from "@batijs/core/config";
import { buildAgentsMd } from "../agents-md.js";
import { composeAgentFiles } from "../compose.js";

export default async function onafter(cwd: string, meta: VikeMeta, { skills, env }: HookContext): Promise<void> {
  const agentFiles = composeAgentFiles(meta, skills, buildAgentsMd(meta, env.length > 0));
  for (const { path, content } of agentFiles) {
    const dest = join(cwd, path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf-8");
  }
}
