import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

// Prisma requires an explicit engine, and an engine requires a Server.
export default suite()
  .matrix({ framework: spread(framework), server: "hono", flags: "prisma", db: ["sqlite", "postgres"] })
  .linters("eslint", "biome", "oxlint");

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("should have TODO.md", () => {
    expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
  });
});
