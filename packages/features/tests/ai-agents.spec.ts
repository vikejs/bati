import { expect, test } from "vitest";
import { aiAgentFlags, resolveInstructionFiles, resolveSkillDirs } from "../src/ai-agents.js";
import { features } from "../src/features.js";
import { BatiSet } from "../src/helpers.js";

test("aiAgentFlags stays in sync with the AI Agent category", () => {
  expect(aiAgentFlags).toEqual(["claude", "codex", "gemini", "cursor", "copilot"]);
});

test("resolveSkillDirs — minimal dir set (SKILLS_PLAN §4)", () => {
  expect(resolveSkillDirs([])).toEqual([]);
  expect(resolveSkillDirs(["react", "hono"])).toEqual([]); // no agent → nothing
  expect(resolveSkillDirs(["claude"])).toEqual([".claude/skills"]);
  expect(resolveSkillDirs(["codex"])).toEqual([".agents/skills"]);
  // Any of codex/gemini/cursor/copilot collapses to the single canonical `.agents/skills`.
  expect(resolveSkillDirs(["gemini", "cursor", "copilot"])).toEqual([".agents/skills"]);
  // All five agents → at most two dirs.
  expect(resolveSkillDirs(["claude", "codex", "gemini", "cursor", "copilot"])).toEqual([
    ".claude/skills",
    ".agents/skills",
  ]);
});

test("resolveInstructionFiles — canonical AGENTS.md + shims (SKILLS_PLAN §3)", () => {
  expect(resolveInstructionFiles([])).toEqual([]);
  // Native readers only need AGENTS.md.
  expect(resolveInstructionFiles(["codex"])).toEqual([{ path: "AGENTS.md", import: null }]);
  // Claude/Gemini get a one-line @-import shim, and AGENTS.md is always emitted (the shim points at it).
  expect(resolveInstructionFiles(["claude"])).toEqual([
    { path: "AGENTS.md", import: null },
    { path: "CLAUDE.md", import: "@AGENTS.md" },
  ]);
  expect(resolveInstructionFiles(["gemini"])).toEqual([
    { path: "AGENTS.md", import: null },
    { path: "GEMINI.md", import: "@./AGENTS.md" },
  ]);
  // Deduped across all five — only AGENTS.md + the two shims.
  expect(resolveInstructionFiles(["claude", "codex", "gemini", "cursor", "copilot"])).toEqual([
    { path: "AGENTS.md", import: null },
    { path: "CLAUDE.md", import: "@AGENTS.md" },
    { path: "GEMINI.md", import: "@./AGENTS.md" },
  ]);
});

test("BatiSet — hasAiAgent / aiAgents", () => {
  const withAgents = new BatiSet(["react", "claude", "cursor"], features, "npm");
  expect(withAgents.hasAiAgent).toBe(true);
  expect(withAgents.aiAgents).toEqual(["claude", "cursor"]);

  const noAgents = new BatiSet(["react", "hono"], features, "npm");
  expect(noAgents.hasAiAgent).toBe(false);
  expect(noAgents.aiAgents).toEqual([]);
});
