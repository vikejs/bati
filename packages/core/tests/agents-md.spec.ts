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

test("buildAgentsMd — Environment section only when hasEnv", () => {
  expect(buildAgentsMd(meta(["react"]), "npm run")).not.toContain("## Environment");

  const withEnv = buildAgentsMd(meta(["react", "hono", "drizzle", "sqlite"]), "npm run", true);
  expect(withEnv).toContain("## Environment");
  expect(withEnv).toContain("PUBLIC_ENV__");
  expect(withEnv).toContain("`.env`");

  // Cloudflare keeps vars in wrangler.jsonc, not .env secrets.
  const cf = buildAgentsMd(meta(["react", "hono", "cloudflare", "sqlite"]), "npm run", true);
  expect(cf).toContain("wrangler secret put");
});
