import { BatiSet, type Flags, features } from "@batijs/features";
import { expect, test } from "vitest";
import { buildAgentsMd } from "../src/agents-md.js";

function meta(flags: Flags[]) {
  return { BATI: new BatiSet(flags, features, "npm"), BATI_TEST: false };
}

test("buildAgentsMd — lists the selected stack and commands", () => {
  const md = buildAgentsMd(meta(["react", "hono", "telefunc", "claude"]), "npm run");

  expect(md).toContain("# AGENTS.md");
  expect(md).toContain("## Stack");
  expect(md).toContain("- **UI Framework:** React");
  expect(md).toContain("- **Server:** Hono");
  expect(md).toContain("- **Data fetching:** Telefunc");
  expect(md).toContain("`npm run dev`");
  expect(md).toContain("pages/");
  // The agents themselves are not part of the listed stack.
  expect(md).not.toContain("Claude Code");
});

test("buildAgentsMd — server/db structure lines are conditional", () => {
  const spa = buildAgentsMd(meta(["react"]), "pnpm");
  expect(spa).not.toContain("the server entry boots Vike");
  expect(spa).not.toContain("Database access");

  const full = buildAgentsMd(meta(["react", "hono", "drizzle", "sqlite"]), "pnpm");
  expect(full).toContain("the server entry boots Vike");
  expect(full).toContain("Database access");
});
