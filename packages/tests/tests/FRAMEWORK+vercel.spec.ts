import { describeBati, describeMultipleBati, suite } from "@batijs/tests-utils";

export default suite()
  .matrix({ framework: "react", deploy: "vercel", server: ["hono", "h3", "express", "fastify", null] })
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
