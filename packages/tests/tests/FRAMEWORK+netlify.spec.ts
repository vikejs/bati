import { describeBati, describeMultipleBati, suite } from "@batijs/tests-utils";

export default suite()
  .case({ flags: ["vue", "netlify"] })
  .linters("eslint", "biome", "oxlint");

await describeMultipleBati([
  // dev
  () =>
    describeBati(({ test, expect, fetch }) => {
      test("home", async () => {
        const res = await fetch("/");
        expect(res.status).toBe(200);
        expect(await res.text()).not.toContain('{"is404":true}');
      });
    }),
]);
