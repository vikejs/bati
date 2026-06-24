import type { BatiSkill } from "@batijs/core/config";
import { SKILLS_DIR } from "@batijs/features";

export interface ComposedSkill {
  path: string;
  content: string;
}

/** One `SKILL.md` per skill under {@link SKILLS_DIR}, sorted by name so the output is deterministic. */
export function composeSkills(skills: BatiSkill[]): ComposedSkill[] {
  assertUniqueNames(skills);
  return [...skills]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((skill) => ({ path: `${SKILLS_DIR}/${skill.name}/SKILL.md`, content: renderSkillMd(skill) }));
}

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

// Double-quote and escape so the colons/brackets common in descriptions stay YAML-safe.
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
