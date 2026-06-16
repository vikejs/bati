import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, framework, suite } from "@batijs/tests-utils";

const tests = suite()
  // Claude across every framework — checks .claude/skills, the CLAUDE.md shim, and the Vike-core skills.
  .matrix({ framework: framework.values, flags: "claude" })
  // A richer multi-agent combo — checks the canonical .agents/skills dir, the GEMINI.md shim, and the
  // feature skills (server, data, orm).
  .case({
    framework: "react",
    server: "hono",
    data: "trpc",
    db: "sqlite",
    orm: "drizzle",
    flags: ["codex", "gemini"],
  });

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

function exists(...p: string[]): boolean {
  return existsSync(path.join(process.cwd(), ...p));
}
function read(...p: string[]): string {
  return readFileSync(path.join(process.cwd(), ...p), { encoding: "utf-8" });
}

await describeBati(({ test, expect, testMatch }) => {
  test("AGENTS.md is generated with the stack", () => {
    expect(exists("AGENTS.md")).toBe(true);
    expect(read("AGENTS.md")).toContain("## Stack");
  });

  // The minimal dir set + instruction-file shim per agent (SKILLS_PLAN §3/§4).
  testMatch<TestFlags>("skills dir + instruction shim", {
    claude: () => {
      expect(read("CLAUDE.md").trim()).toBe("@AGENTS.md");
      for (const name of ["vike-routing", "vike-data-fetching", "vike-config"]) {
        expect(exists(".claude", "skills", name, "SKILL.md")).toBe(true);
      }
    },
    gemini: () => {
      expect(read("GEMINI.md").trim()).toBe("@./AGENTS.md");
      for (const name of ["vike-routing", "vike-data-fetching", "vike-config"]) {
        expect(exists(".agents", "skills", name, "SKILL.md")).toBe(true);
      }
    },
    _: () => {},
  });

  // Feature skills appear (only) for the richer combo.
  testMatch<TestFlags>("feature skills", {
    drizzle: () => {
      expect(exists(".agents", "skills", "server", "SKILL.md")).toBe(true);
      expect(exists(".agents", "skills", "trpc", "SKILL.md")).toBe(true);
      expect(read(".agents", "skills", "drizzle", "SKILL.md")).toContain("Drizzle ORM on SQLite");
    },
    _: () => {},
  });
}, { mode: "none" });
