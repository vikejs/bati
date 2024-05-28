import { describeBati, dom } from "@batijs/tests-utils";

export const matrix = [
  ["express", "h3", "hono", "fastify", "hattip"],
  [...(process.env.TEST_AUTH0_CLIENT_ID ? (["auth0"] as const) : [])],
  "eslint",
] as const;

await describeBati(({ testMatch, expect, context }) => {
  testMatch<typeof matrix>("auth/signin", {
    auth0: async () => {
      const browser = new dom.Browser();
      const page = browser.newPage();

      await page.goto(`http://localhost:${context.port}/api/auth/signin`);

      const el = page.mainFrame.document.querySelector('form[action*="/api/auth/signin/auth0"]');

      if (el) {
        (el as dom.HTMLFormElement).submit();
      }

      await page.waitUntilComplete();

      expect(page.url).toBe(`http://localhost:${context.port}/api/auth/signin/auth0`);
    },
  });
});
