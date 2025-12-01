import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati } from "@batijs/tests-utils";

export const matrix = ["cloudflare", "react", ["hono", "h3", undefined], "eslint", "biome", "oxlint"] as const;

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
