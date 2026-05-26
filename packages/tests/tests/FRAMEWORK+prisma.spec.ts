import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

export default suite()
  .case({ framework: spread(framework), flags: "prisma" })
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
