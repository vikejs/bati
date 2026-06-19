import type { BatiSkill } from "@batijs/core/config";
import { BatiSet, type Flags, features } from "@batijs/features";
import { expect, test } from "vitest";
import { composeAgentFiles, renderSkillMd } from "./compose.js";

function meta(flags: Flags[]) {
  return { BATI: new BatiSet(flags, features, "npm"), BATI_TEST: false };
}

const skill: BatiSkill = {
  name: "vike-routing",
  description: "Add pages and routes. Use when creating a page or changing routing.",
  body: "In this project, pages live in `pages/`.",
};

test("renderSkillMd — frontmatter + body", () => {
  expect(renderSkillMd(skill)).toBe(
    `---
name: "vike-routing"
description: "Add pages and routes. Use when creating a page or changing routing."
---

In this project, pages live in \`pages/\`.
`,
  );
});

test("renderSkillMd — allowed-tools when present", () => {
  expect(renderSkillMd({ ...skill, allowedTools: ["Read", "Edit"] })).toContain(`allowed-tools: ["Read", "Edit"]`);
});

test("composeAgentFiles — nothing without an AI agent", () => {
  expect(composeAgentFiles(meta(["react", "hono"]), [skill], "# AGENTS")).toEqual([]);
});

test("composeAgentFiles — Claude: .claude/skills + AGENTS.md + CLAUDE.md shim", () => {
  const files = composeAgentFiles(meta(["react", "claude"]), [skill], "# AGENTS\n");
  expect(files.map((f) => f.path)).toEqual([".claude/skills/vike-routing/SKILL.md", "AGENTS.md", "CLAUDE.md"]);
  expect(files.find((f) => f.path === "AGENTS.md")?.content).toBe("# AGENTS\n");
  expect(files.find((f) => f.path === "CLAUDE.md")?.content).toBe("@AGENTS.md\n");
});

test("composeAgentFiles — Codex: canonical .agents/skills + native AGENTS.md only", () => {
  const files = composeAgentFiles(meta(["codex"]), [skill], "# AGENTS\n");
  expect(files.map((f) => f.path)).toEqual([".agents/skills/vike-routing/SKILL.md", "AGENTS.md"]);
});

test("composeAgentFiles — Claude + Codex: both dirs, skills sorted by name", () => {
  const second: BatiSkill = { name: "auth-guards", description: "Protect routes.", body: "..." };
  const files = composeAgentFiles(meta(["claude", "codex"]), [skill, second], "# AGENTS\n");
  expect(files.map((f) => f.path)).toEqual([
    ".claude/skills/auth-guards/SKILL.md",
    ".claude/skills/vike-routing/SKILL.md",
    ".agents/skills/auth-guards/SKILL.md",
    ".agents/skills/vike-routing/SKILL.md",
    "AGENTS.md",
    "CLAUDE.md",
  ]);
});

test("composeAgentFiles — duplicate skill names throw", () => {
  expect(() => composeAgentFiles(meta(["claude"]), [skill, skill], "# AGENTS")).toThrow(/Duplicate skill name/);
});
