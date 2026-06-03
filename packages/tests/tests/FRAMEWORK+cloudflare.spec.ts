import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati, suite } from "@batijs/tests-utils";

export default suite()
  .matrix({ framework: "react", deploy: "cloudflare", server: ["hono", null] })
  .linters("eslint", "biome", "oxlint");

await describeMultipleBati([
  // dev
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
        retry: 3,
      },
    ),
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
        script: "preview",
        retry: 3,
      },
    ),
  // deploy
  () =>
    describeBati(
      ({ test, expect, exec, npmCli }) => {
        test("should have TODO.md", () => {
          expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
        });

        test("deploy --dry-run", async () => {
          await expect(exec(npmCli, ["run", "deploy", "--dry-run"])).resolves.not.toThrow();
        });
      },
      {
        mode: "none",
        retry: 3,
      },
    ),
]);
