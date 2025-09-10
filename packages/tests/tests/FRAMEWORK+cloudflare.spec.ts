import { describeBati } from "@batijs/tests-utils";

export const matrix = ["cloudflare", "react", ["hono", "h3", undefined], "eslint", "biome"] as const;

// dev
await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});

// preview
await describeBati(
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
);

// deploy
await describeBati(
  ({ test, expect, exec, npmCli }) => {
    test("deploy --dry-run", async () => {
      await expect(exec(npmCli, ["run", "deploy", "--dry-run"])).resolves.not.toThrow();
    });
  },
  {
    mode: "none",
  },
);
