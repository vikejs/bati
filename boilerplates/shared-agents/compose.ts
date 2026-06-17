import type { BatiSkill, VikeMeta } from "@batijs/core/config";
import { resolveInstructionFiles, resolveSkillDirs } from "@batijs/features";

export interface ComposedAgentFile {
  /** Path relative to the app root. */
  path: string;
  content: string;
}

/**
 * Materialize the agent files for a scaffold (SKILLS_PLAN.md §3/§4): every skill written to each
 * minimal skills dir, plus the canonical `AGENTS.md` (= `agentsBody`) and its `@AGENTS.md` shims.
 * Output order is deterministic (canonical agent order; skills sorted by name) for stable snapshots.
 */
export function composeAgentFiles(meta: VikeMeta, skills: BatiSkill[], agentsBody: string): ComposedAgentFile[] {
  assertUniqueNames(skills);

  const selected = meta.BATI.aiAgents;
  const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
  const files: ComposedAgentFile[] = [];

  for (const dir of resolveSkillDirs(selected)) {
    for (const skill of sortedSkills) {
      files.push({ path: `${dir}/${skill.name}/SKILL.md`, content: renderSkillMd(skill) });
    }
  }
  for (const target of resolveInstructionFiles(selected)) {
    files.push({
      path: target.path,
      content: target.import === null ? ensureTrailingNewline(agentsBody) : `${target.import}\n`,
    });
  }
  return files;
}

/** Serialize a skill to a `SKILL.md` document (YAML frontmatter + body). */
export function renderSkillMd(skill: BatiSkill): string {
  const frontmatter = [`name: ${yamlString(skill.name)}`, `description: ${yamlString(skill.description)}`];
  if (skill.allowedTools?.length) {
    frontmatter.push(`allowed-tools: [${skill.allowedTools.map(yamlString).join(", ")}]`);
  }
  return `---\n${frontmatter.join("\n")}\n---\n\n${ensureTrailingNewline(skill.body)}`;
}

function assertUniqueNames(skills: BatiSkill[]): void {
  const seen = new Set<string>();
  for (const { name } of skills) {
    if (seen.has(name)) throw new Error(`Duplicate skill name '${name}' — skill names must be unique.`);
    seen.add(name);
  }
}

function ensureTrailingNewline(s: string): string {
  return s.endsWith("\n") ? s : `${s}\n`;
}

/** Double-quote and escape so the colons/brackets common in descriptions stay YAML-safe. */
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
