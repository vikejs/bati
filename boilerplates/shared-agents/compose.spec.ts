import type { BatiSkill } from "@batijs/core/config";
import { expect, test } from "vitest";
import { composeSkills, renderSkillMd } from "./compose.js";

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

test("composeSkills — one SKILL.md per skill under the canonical dir, sorted by name", () => {
  const second: BatiSkill = { name: "auth-guards", description: "Protect routes.", body: "..." };
  expect(composeSkills([skill, second]).map((f) => f.path)).toEqual([
    ".agents/skills/auth-guards/SKILL.md",
    ".agents/skills/vike-routing/SKILL.md",
  ]);
});

test("composeSkills — duplicate skill names throw", () => {
  expect(() => composeSkills([skill, skill])).toThrow(/Duplicate skill name/);
});
