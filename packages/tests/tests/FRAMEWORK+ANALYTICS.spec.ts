import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati, framework, suite } from "@batijs/tests-utils";

// Framework matters here — vue+google-analytics uses +onCreateApp.ts instead
// of the inline script tag. Keep full 3×3 sweep.
const tests = suite()
  .matrix({ framework: framework.values, analytics: ["plausible.io", "google-analytics", null] })
  .linters("eslint", "biome", "oxlint");

export default tests;

type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeBati(({ expect, fetch, testMatch }) => {
  testMatch<TestFlags>("home", {
    "plausible.io": async () => {
      const res = await fetch("/");
      expect(res.status).toBe(200);
      const text = await res.text();

      expect(text).toContain('src="https://plausible.io');
      expect(text).not.toContain('src="https://www.googletagmanager.com');
    },
    "google-analytics": {
      vue: async () => {
        const res = await fetch("/");
        expect(res.status).toBe(200);
        const text = await res.text();

        const resOnCreateApp = await fetch("/pages/+onCreateApp.ts");

        expect(text).not.toContain('src="https://plausible.io');
        expect(resOnCreateApp.status).toBe(200);
        expect(await resOnCreateApp.text()).toContain("gtag");
      },
      _: async () => {
        const res = await fetch("/");
        expect(res.status).toBe(200);
        const text = await res.text();

        const resOnCreateApp = await fetch("/pages/+onCreateApp.ts");

        expect(text).not.toContain('src="https://plausible.io');
        expect(text).toContain('src="https://www.googletagmanager.com');
        expect(resOnCreateApp.status).toBe(404);
      },
    },
    _: async () => {
      const res = await fetch("/");
      expect(res.status).toBe(200);
      const text = await res.text();

      expect(text).not.toContain('src="https://www.googletagmanager.com');
      expect(text).not.toContain('src="https://plausible.io');
    },
  });

  testMatch<TestFlags>("TODO.md presence", {
    "plausible.io": async () => {
      expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
    },
    _: async () => {
      expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(false);
    },
  });
});
