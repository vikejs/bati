import { expect, test } from "vitest";
import { composeSkills, renderSkillMd } from "./compose.js";

test("renderSkillMd — frontmatter + URL-only body", () => {
  expect(
    renderSkillMd("react", "React", {
      description: "React + Vike conventions. Use when writing components or handling SSR/hydration.",
      llms: "https://react.dev/llms.txt",
    }),
  ).toBe(
    `---
name: "react"
description: "React + Vike conventions. Use when writing components or handling SSR/hydration."
---

Up-to-date React documentation for this project. Read it before working with React:

https://react.dev/llms.txt
`,
  );
});

test("composeSkills — one SKILL.md per selected feature that has a skill, sorted by flag", () => {
  const composed = composeSkills((flag) => (["vike", "react", "drizzle"] as string[]).includes(flag));
  expect(composed.map((c) => c.path)).toEqual([
    ".agents/skills/drizzle/SKILL.md",
    ".agents/skills/react/SKILL.md",
    ".agents/skills/vike/SKILL.md",
  ]);
  const react = composed.find((c) => c.path.includes("/react/"));
  expect(react?.content).toContain(`name: "react"`);
  expect(react?.content).toContain("https://react.dev/llms.txt");
});

test("composeSkills — features without a skill are never emitted, even when selected", () => {
  // `eslint` has no `skill` field (no llms.txt), so it must produce no skill.
  const paths = composeSkills((flag) => flag === "eslint").map((c) => c.path);
  expect(paths).not.toContain(".agents/skills/eslint/SKILL.md");
});

test("composeSkills — readonly features (vike) are emitted even when nothing is selected", () => {
  // Vike is `readonly` (always in the stack), so its skill ships regardless of selection.
  expect(composeSkills(() => false).map((c) => c.path)).toEqual([".agents/skills/vike/SKILL.md"]);
});
