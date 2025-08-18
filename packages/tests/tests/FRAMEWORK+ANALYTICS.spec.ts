import { describeBati } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["plausible.io", "google-analytics", undefined],
  "eslint",
  "biome",
] as const;

await describeBati(({ expect, fetch, testMatch }) => {
  testMatch<typeof matrix>("home", {
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
});
