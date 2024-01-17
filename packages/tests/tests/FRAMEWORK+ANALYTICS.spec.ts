import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["plausible.io", "google-analytics", undefined], "eslint"];

await describeBati(({ test, expect, fetch, context }) => {
  test("home", async () => {
    const res = await fetch("/");
    const resOnCreateApp = await fetch("/pages/+onCreateApp.ts");

    expect(res.status).toBe(200);

    const text = await res.text();

    if (context.flags.includes("plausible.io")) {
      expect(text).toContain('src="https://plausible.io');
      expect(text).not.toContain('src="https://www.googletagmanager.com');
    } else if (context.flags.includes("google-analytics")) {
      expect(text).not.toContain('src="https://plausible.io');
      if (!context.flags.includes("vue")) {
        expect(text).toContain('src="https://www.googletagmanager.com');
        expect(resOnCreateApp.status).toBe(404);
      } else {
        expect(resOnCreateApp.status).toBe(200);
        expect(await resOnCreateApp.text()).toContain("gtag");
      }
    } else {
      expect(text).not.toContain('src="https://www.googletagmanager.com');
      expect(text).not.toContain('src="https://plausible.io');
    }
  });
});
