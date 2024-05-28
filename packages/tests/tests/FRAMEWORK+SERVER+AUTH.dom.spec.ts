import { describeBati, dom } from "@batijs/tests-utils";

export const matrix = [
  ["express", "h3", "hono", "fastify", "hattip"],
  [...(process.env.TEST_AUTH0_CLIENT_ID ? (["auth0"] as const) : [])],
  "eslint",
] as const;

// How to configure your environment for testing auth?
// First, create a .env.test file at the root of bati workspace
// Then, for firebase, generate a service account json file, and put in .env.test like so
// TEST_FIREBASE_ACCOUNT=`{
//   ...
// }`
//
// For auth0, you must put your client ID and Issuer base URL in .env.test like so
// TEST_AUTH0_CLIENT_ID=...
// TEST_AUTH0_ISSUER_BASE_URL=https://<...>.auth0.com

await describeBati(({ testMatch, expect, context }) => {
  testMatch<typeof matrix>("auth/signin", {
    auth0: async () => {
      const browser = new dom.Browser();
      const page = browser.newPage();

      await page.goto(`http://localhost:${context.port}/api/auth/signin`);

      const el = page.mainFrame.document.querySelector('form[action*="/api/auth/signin/auth0"] button');

      if (el) {
        (el as dom.HTMLButtonElement).click();
      }

      await page.waitForNavigation();

      expect(page.url).toBe("");
    },
  });
});
