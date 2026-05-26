import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

// Prettier formatting is framework-agnostic — one combo is enough, and the
// global balancer rotates which framework hosts it across spec files.
// Was 3 combos in the old matrix; now 1.
export default suite()
  .case({ framework: spread(framework), flags: "prettier" })
  .linters("eslint", "biome", "oxlint");

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
