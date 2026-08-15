import type { Feature, Flags } from "@batijs/features";
import { features, SKILLS_DIR } from "@batijs/features";

export interface ComposedSkill {
  path: string;
  content: string;
}

/**
 * One `SKILL.md` per in-stack feature that publishes an `llms.txt`, under {@link SKILLS_DIR}, sorted by
 * flag (deterministic output). Each skill is a pointer to the live docs — no how-to is stored, so it never
 * goes stale. Flags are unique, so names never collide. `readonly` features (e.g. Vike) are always in the
 * stack, so their skill is emitted regardless of selection.
 */
export function composeSkills(isSelected: (flag: Flags) => boolean): ComposedSkill[] {
  return (features as ReadonlyArray<Feature>)
    .filter((f): f is Feature & { skill: string } => Boolean(f.skill) && (f.readonly || isSelected(f.flag as Flags)))
    .sort((a, b) => a.flag.localeCompare(b.flag))
    .map((f) => ({ path: `${SKILLS_DIR}/${f.flag}/SKILL.md`, content: renderSkillMd(f.flag, f.label, f.skill) }));
}

export function renderSkillMd(flag: string, label: string, llms: string): string {
  // Deliberately vague: the agent should reach for the docs when it's unsure, not on every edit.
  const description = `${label} documentation — consider reading it, e.g. when using uncommon ${label} APIs or when stuck on ${article(label)} ${label} problem`;
  return `---\nname: ${yamlString(flag)}\ndescription: ${yamlString(description)}\n---\n\nSee ${llms}\n`;
}

function article(label: string): string {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

// Double-quote and escape so the colons/brackets common in descriptions stay YAML-safe.
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
