import { cp, mkdir, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import type { HookContext, VikeMeta } from "@batijs/core/config";
import { CLAUDE_SKILLS_DIR, SKILLS_DIR } from "@batijs/features";
import { composeSkills } from "../compose.js";

export default async function onafter(cwd: string, _meta: VikeMeta, { skills }: HookContext): Promise<void> {
  for (const { path, content } of composeSkills(skills)) {
    const dest = join(cwd, path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf-8");
  }
  await mirrorSkillsForClaude(cwd);
}

// Claude Code reads only `.claude/skills`; point it at the canonical dir, copying where symlinks
// aren't supported (Windows without privilege, StackBlitz/WebContainer, zip downloads).
async function mirrorSkillsForClaude(cwd: string): Promise<void> {
  const source = join(cwd, SKILLS_DIR);
  const target = join(cwd, CLAUDE_SKILLS_DIR);
  await mkdir(dirname(target), { recursive: true });
  try {
    await symlink(relative(dirname(target), source), target, "dir");
  } catch {
    await cp(source, target, { recursive: true });
  }
}
