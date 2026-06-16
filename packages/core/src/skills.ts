/**
 * Composer for agent **skills** and **instruction files** (SKILLS_PLAN.md §3, §4, §8).
 *
 * Each feature exposes a `skills(meta)` producer in its `bati.config.ts`; the CLI runs every
 * selected boilerplate's producer, merges the results, and—gated on at least one selected AI
 * agent—materializes them via {@link composeAgentFiles}:
 *  - every skill is written to the minimal set of skills dirs (`.agents/skills` + `.claude/skills`)
 *  - a canonical `AGENTS.md` is emitted alongside `@AGENTS.md` import shims for Claude/Gemini
 *
 * A skill declaration is pure data and never names a destination; routing lives here and in
 * `@batijs/features` (`resolveSkillDirs` / `resolveInstructionFiles`).
 */
import { resolveInstructionFiles, resolveSkillDirs } from "@batijs/features";
import { assert } from "./assert.js";
import type { VikeMeta } from "./types.js";

export interface BatiSkill {
  /** Unique skill name across all boilerplates → `<skills-dir>/<name>/SKILL.md`. */
  name: string;
  /** Auto-trigger description: what the skill does and when to use it. */
  description: string;
  /** Markdown body (without frontmatter — the composer adds it). */
  body: string;
  /**
   * Optional tool allowlist (Claude/Copilot frontmatter). Emitted as `allowed-tools`;
   * agents that don't support it simply ignore the key.
   */
  allowedTools?: string[];
}

/** A feature's skill producer; meta-gating (does the skill apply?) lives here. */
export type BatiSkillFactory = (meta: VikeMeta) => BatiSkill[];

/** A file the composer emits, with a path relative to the app root. */
export interface ComposedAgentFile {
  path: string;
  content: string;
}

/** Serialize a skill to a `SKILL.md` document (YAML frontmatter + body). */
export function renderSkillMd(skill: BatiSkill): string {
  const frontmatter = [`name: ${yamlString(skill.name)}`, `description: ${yamlString(skill.description)}`];
  if (skill.allowedTools && skill.allowedTools.length > 0) {
    frontmatter.push(`allowed-tools: [${skill.allowedTools.map(yamlString).join(", ")}]`);
  }
  return `---\n${frontmatter.join("\n")}\n---\n\n${ensureTrailingNewline(skill.body)}`;
}

/**
 * Compose the agent files for a scaffold (SKILLS_PLAN.md §3/§4):
 *  - each skill → `<dir>/<name>/SKILL.md` for every dir in the minimal set
 *  - instruction files → canonical `AGENTS.md` (= `agentsBody`) plus `@AGENTS.md` shims
 *
 * Returns `[]` when no AI agent is selected. Output order is deterministic (dirs and instruction
 * files follow the canonical agent order; skills are sorted by name) so e2e snapshots stay stable.
 */
export function composeAgentFiles(meta: VikeMeta, skills: BatiSkill[], agentsBody: string): ComposedAgentFile[] {
  if (!meta.BATI.hasAiAgent) return [];

  const seen = new Set<string>();
  for (const skill of skills) {
    assert(!seen.has(skill.name), `Duplicate skill name '${skill.name}' — skill names must be unique.`);
    seen.add(skill.name);
  }

  const selected = meta.BATI.aiAgents;
  const files: ComposedAgentFile[] = [];

  const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
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

function ensureTrailingNewline(s: string): string {
  return s.endsWith("\n") ? s : `${s}\n`;
}

/** Double-quote and escape a scalar so colons/brackets common in descriptions are YAML-safe. */
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
