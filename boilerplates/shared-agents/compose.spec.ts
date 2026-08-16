import { expect, test } from "vitest";
import { composeSkills, renderSkillMd } from "./compose.js";

test("renderSkillMd — frontmatter + URL-only body", () => {
  expect(renderSkillMd("react", "React", "https://react.dev/llms.txt")).toBe(
    `---
name: "react"
description: "React documentation index — a compact overview of React's docs. Consider consulting it, e.g. when using uncommon React APIs or when stuck on a React problem."
---

See https://react.dev/llms.txt
`,
  );
});

test("renderSkillMd — a label starting with a vowel gets the right article", () => {
  expect(renderSkillMd("express", "Express", "https://expressjs.com/llms.txt")).toContain(
    "when stuck on an Express problem",
  );
});

test("renderSkillMd — a label ending in s takes a bare possessive apostrophe", () => {
  expect(renderSkillMd("edgeone", "EdgeOne Pages", "https://edgeone.ai/llms.txt")).toContain(
    "overview of EdgeOne Pages' docs",
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
  // `eslint` has no `skill` URL (no llms.txt), so it must produce no skill.
  const paths = composeSkills((flag) => flag === "eslint").map((c) => c.path);
  expect(paths).not.toContain(".agents/skills/eslint/SKILL.md");
});

test("composeSkills — readonly features (vike) are emitted even when nothing is selected", () => {
  // Vike is `readonly` (always in the stack), so its skill ships regardless of selection.
  expect(composeSkills(() => false).map((c) => c.path)).toEqual([".agents/skills/vike/SKILL.md"]);
});
