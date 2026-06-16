import { features, type Flags } from "./features.js";

/**
 * The flags in the "AI Agent" category, kept in sync with `features.ts`.
 */
export type AiAgentFlag = Extract<(typeof features)[number], { category: "AI Agent" }>["flag"];

export const aiAgentFlags = features
  .filter((f): f is Extract<(typeof features)[number], { category: "AI Agent" }> => f.category === "AI Agent")
  .map((f) => f.flag);

export interface AiAgentMeta {
  /**
   * Project directory this agent reads skills from. `.agents/skills` is the cross-tool standard
   * read natively by Codex, Gemini, Cursor and Copilot; only Claude is limited to `.claude/skills`.
   */
  skillsDir: string;
  /** Project instruction file this agent reads. */
  instructionFile: string;
  /**
   * When set, the instruction file is a one-line import of the canonical `AGENTS.md`
   * (e.g. `@AGENTS.md`). When `null`, the agent reads `AGENTS.md` natively.
   */
  instructionImport: string | null;
}

/**
 * Per-agent skill + instruction-file targets, verified against each agent's official docs
 * (see SKILLS_PLAN.md §15). The two agents that don't read `AGENTS.md` natively — Claude and
 * Gemini — are exactly the two that support an `@`-import, so a one-line shim covers them.
 */
export const aiAgents = {
  claude: { skillsDir: ".claude/skills", instructionFile: "CLAUDE.md", instructionImport: "@AGENTS.md" },
  codex: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
  gemini: { skillsDir: ".agents/skills", instructionFile: "GEMINI.md", instructionImport: "@./AGENTS.md" },
  cursor: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
  copilot: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
} as const satisfies Record<AiAgentFlag, AiAgentMeta>;

/**
 * Minimal set of skill directories covering the selected agents (SKILLS_PLAN.md §4):
 * `.agents/skills` for any of Codex/Gemini/Cursor/Copilot, plus `.claude/skills` for Claude.
 * Returns at most two dirs regardless of how many agents are selected.
 */
export function resolveSkillDirs(selected: Iterable<Flags | string>): string[] {
  const sel = new Set(selected);
  const dirs = new Set<string>();
  for (const flag of aiAgentFlags) {
    if (sel.has(flag)) dirs.add(aiAgents[flag as AiAgentFlag].skillsDir);
  }
  return [...dirs];
}

export interface InstructionFileTarget {
  /** File path relative to the app root, e.g. `AGENTS.md`, `CLAUDE.md`. */
  path: string;
  /** A one-line import directive when this is a shim; `null` means write the full canonical content here. */
  import: string | null;
}

/**
 * Instruction files to emit for the selected agents (SKILLS_PLAN.md §3). The canonical `AGENTS.md`
 * is always emitted when any agent is selected (the Claude/Gemini shims import it); the rest read it
 * natively. Deduped by path. Returns `[]` when no agent is selected.
 */
export function resolveInstructionFiles(selected: Iterable<Flags | string>): InstructionFileTarget[] {
  const sel = new Set(selected);
  if (!aiAgentFlags.some((flag) => sel.has(flag))) return [];

  const byPath = new Map<string, InstructionFileTarget>();
  // Canonical instruction content always lives in AGENTS.md — the shims point at it.
  byPath.set("AGENTS.md", { path: "AGENTS.md", import: null });
  for (const flag of aiAgentFlags) {
    if (!sel.has(flag)) continue;
    const { instructionFile, instructionImport } = aiAgents[flag as AiAgentFlag];
    if (!byPath.has(instructionFile)) {
      byPath.set(instructionFile, { path: instructionFile, import: instructionImport });
    }
  }
  return [...byPath.values()];
}
