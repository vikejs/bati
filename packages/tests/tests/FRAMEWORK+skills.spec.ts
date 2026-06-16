import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, framework, suite } from "@batijs/tests-utils";

const tests = suite()
  // Claude across every framework — checks .claude/skills, the CLAUDE.md shim, and the Vike-core skills.
  .matrix({ framework: framework.values, flags: "claude" })
  // A richer multi-agent combo — checks the canonical .agents/skills dir, the GEMINI.md shim, and the
  // backend feature skills (server, data, orm).
  .case({
    framework: "react",
    server: "hono",
    data: "trpc",
    db: "sqlite",
    orm: "drizzle",
    flags: ["codex", "gemini"],
  })
  // A frontend/deploy combo — checks the long-tail skills (styling, deploy, analytics).
  .case({
    framework: "vue",
    css: "tailwindcss",
    deploy: "vercel",
    analytics: "plausible.io",
    flags: ["cursor"],
  });

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

function exists(...p: string[]): boolean {
  return existsSync(path.join(process.cwd(), ...p));
}
function read(...p: string[]): string {
  return readFileSync(path.join(process.cwd(), ...p), { encoding: "utf-8" });
}
// A skill exists if it's in either materialized dir (.agents/skills for codex/gemini/cursor/copilot,
// .claude/skills for Claude) — see SKILLS_PLAN §4.
function skillExists(name: string): boolean {
  return exists(".agents", "skills", name, "SKILL.md") || exists(".claude", "skills", name, "SKILL.md");
}

await describeBati(({ test, expect, testMatch }) => {
  test("AGENTS.md is generated with the stack", () => {
    expect(exists("AGENTS.md")).toBe(true);
    expect(read("AGENTS.md")).toContain("## Stack");
  });

  test("Vike-core skills are always present", () => {
    for (const name of ["vike-routing", "vike-data-fetching", "vike-config"]) {
      expect(skillExists(name)).toBe(true);
    }
  });

  // The instruction-file shim per agent (SKILLS_PLAN §3).
  testMatch<TestFlags>("instruction shim", {
    claude: () => {
      expect(read("CLAUDE.md").trim()).toBe("@AGENTS.md");
      expect(exists(".claude", "skills", "vike-routing", "SKILL.md")).toBe(true);
    },
    gemini: () => {
      expect(read("GEMINI.md").trim()).toBe("@./AGENTS.md");
      expect(exists(".agents", "skills", "vike-routing", "SKILL.md")).toBe(true);
    },
    _: () => {},
  });

  // Backend feature skills (only the trpc/drizzle combo).
  testMatch<TestFlags>("backend skills", {
    drizzle: () => {
      expect(skillExists("server")).toBe(true);
      expect(skillExists("trpc")).toBe(true);
      expect(read(".agents", "skills", "drizzle", "SKILL.md")).toContain("Drizzle ORM on SQLite");
    },
    _: () => {},
  });

  // Long-tail feature skills (only the tailwind/vercel/plausible combo).
  testMatch<TestFlags>("frontend + deploy skills", {
    tailwindcss: () => {
      expect(skillExists("styling")).toBe(true);
      expect(skillExists("deploy")).toBe(true);
      expect(skillExists("analytics")).toBe(true);
    },
    _: () => {},
  });
}, { mode: "none" });
