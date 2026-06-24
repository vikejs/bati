import type { Feature, Flags } from "@batijs/features";
import { features, SKILLS_DIR } from "@batijs/features";

export interface ComposedSkill {
  path: string;
  content: string;
}

type Skill = { description: string; llms: string };

/**
 * One `SKILL.md` per in-stack feature that publishes an `llms.txt`, under {@link SKILLS_DIR}, sorted by
 * flag (deterministic output). Each skill is a pointer to the live docs — no how-to is stored, so it never
 * goes stale. Flags are unique, so names never collide. `readonly` features (e.g. Vike) are always in the
 * stack, so their skill is emitted regardless of selection.
 */
export function composeSkills(isSelected: (flag: Flags) => boolean): ComposedSkill[] {
  return (features as ReadonlyArray<Feature>)
    .filter((f): f is Feature & { skill: Skill } => Boolean(f.skill) && (f.readonly || isSelected(f.flag as Flags)))
    .sort((a, b) => a.flag.localeCompare(b.flag))
    .map((f) => ({ path: `${SKILLS_DIR}/${f.flag}/SKILL.md`, content: renderSkillMd(f.flag, f.label, f.skill) }));
}

export function renderSkillMd(flag: string, label: string, skill: Skill): string {
  const frontmatter = `name: ${yamlString(flag)}\ndescription: ${yamlString(skill.description)}`;
  const body = `Up-to-date ${label} documentation for this project. Read it before working with ${label}:\n\n${skill.llms}`;
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

// Double-quote and escape so the colons/brackets common in descriptions stay YAML-safe.
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
