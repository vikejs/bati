import { describeBati, dom } from "@batijs/tests-utils";

export const matrix = [["express", "h3", "hono", "fastify", "hattip"], ["auth0"], "eslint"] as const;

await describeBati(({ testMatch, expect, context }) => {
  testMatch<typeof matrix>("auth/signin", {
    auth0: async () => {
      // Skip test if those are not available
      if (!process.env.TEST_AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_ID) {
        expect(1).toBe(1);
        return;
      }
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
