import { type Flags, features } from "./features.js";

/** The flags in the "AI Agent" category, kept in sync with `features.ts`. */
export type AiAgentFlag = Extract<(typeof features)[number], { category: "AI Agent" }>["flag"];

export const aiAgentFlags = features
  .filter((f): f is Extract<(typeof features)[number], { category: "AI Agent" }> => f.category === "AI Agent")
  .map((f) => f.flag);

export interface AiAgentMeta {
  /** Project dir this agent reads skills from. */
  skillsDir: string;
  /** Project instruction file this agent reads. */
  instructionFile: string;
  /** One-line `@AGENTS.md` import for agents that can't read AGENTS.md natively; `null` otherwise. */
  instructionImport: string | null;
}

/**
 * Per-agent skill + instruction-file targets, verified against each agent's docs (SKILLS_PLAN.md §15):
 * `.agents/skills` is the cross-tool standard (Codex/Gemini/Cursor/Copilot), only Claude needs
 * `.claude/skills`; AGENTS.md is native everywhere except Claude and Gemini, which take an `@`-import.
 */
export const aiAgents = {
  claude: { skillsDir: ".claude/skills", instructionFile: "CLAUDE.md", instructionImport: "@AGENTS.md" },
  codex: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
  gemini: { skillsDir: ".agents/skills", instructionFile: "GEMINI.md", instructionImport: "@./AGENTS.md" },
  cursor: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
  copilot: { skillsDir: ".agents/skills", instructionFile: "AGENTS.md", instructionImport: null },
} as const satisfies Record<AiAgentFlag, AiAgentMeta>;

/**
 * Minimal set of skill directories covering the selected agents (SKILLS_PLAN.md §4) — at most two:
 * `.agents/skills` for Codex/Gemini/Cursor/Copilot, `.claude/skills` for Claude.
 */
export function resolveSkillDirs(selected: Iterable<Flags>): string[] {
  const sel = new Set(selected);
  const dirs = new Set<string>();
  for (const flag of aiAgentFlags) {
    if (sel.has(flag)) dirs.add(aiAgents[flag].skillsDir);
  }
  return [...dirs];
}

export interface InstructionFileTarget {
  /** Path relative to the app root. */
  path: string;
  /** Import directive for a shim; `null` means write the canonical content here. */
  import: string | null;
}

/**
 * Instruction files for the selected agents (SKILLS_PLAN.md §3): the canonical `AGENTS.md` (always,
 * since the shims import it) plus each agent's file, deduped. Empty when no agent is selected.
 */
export function resolveInstructionFiles(selected: Iterable<Flags>): InstructionFileTarget[] {
  const sel = new Set(selected);
  if (!aiAgentFlags.some((flag) => sel.has(flag))) return [];

  const byPath = new Map<string, InstructionFileTarget>([["AGENTS.md", { path: "AGENTS.md", import: null }]]);
  for (const flag of aiAgentFlags) {
    if (!sel.has(flag)) continue;
    const { instructionFile, instructionImport } = aiAgents[flag];
    byPath.set(instructionFile, { path: instructionFile, import: instructionImport });
  }
  return [...byPath.values()];
}
