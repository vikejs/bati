import { describeBati, describeMultipleBati } from "@batijs/tests-utils";

export const matrix = ["react", "vercel", ["hono", "h3", "express", "fastify", undefined], "eslint", "biome"];

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
  // preview
  () =>
    describeBati(
      ({ test, expect, fetch }) => {
        test("home", async () => {
          const res = await fetch("/");
          expect(res.status).toBe(200);
          expect(await res.text()).not.toContain('{"is404":true}');
        });
      },
      {
        mode: "prod",
      },
    ),
]);
