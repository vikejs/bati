import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["sentry", ["solid", "react", "vue"], "eslint", "biome"];

await describeBati(({ test, expect, testMatch }) => {
  testMatch<typeof matrix>("sentry.browser.config.ts", {
    vue: async () => {
      expect(existsSync(path.join(process.cwd(), "pages", "+client.ts"))).toBe(false);
    },
    _: async () => {
      expect(existsSync(path.join(process.cwd(), "pages", "+client.ts"))).toBe(true);
    },
  });

  test(".env exists", async () => {
    const filePath = path.join(process.cwd(), ".env");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, { encoding: "utf-8" });
    expect(content).toContain(`SENTRY_DSN=`);
    expect(content).toContain(`PUBLIC_ENV__SENTRY_DSN=`);
  });

  test(".env.sentry-build-plugin exists", async () => {
    const filePath = path.join(process.cwd(), ".env.sentry-build-plugin");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, { encoding: "utf-8" });
    expect(content).toContain(`SENTRY_ORG=`);
    expect(content).toContain(`SENTRY_PROJECT=`);
    expect(content).toContain(`SENTRY_AUTH_TOKEN=`);
  });

  test("sentryVitePlugin exists", async () => {
    const filePath = path.join(process.cwd(), "vite.config.ts");
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, { encoding: "utf-8" });
    expect(content).toContain(`from "@sentry/vite-plugin"`);
    expect(content).toContain(`sentryVitePlugin`);
  });

  testMatch<typeof matrix>("sentry.browser.config.ts", {
    react: async () => {
      const filePath = path.join(process.cwd(), "sentry.browser.config.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, { encoding: "utf-8" });
      expect(content).toContain(`from "@sentry/react"`);
    },
    solid: async () => {
      const filePath = path.join(process.cwd(), "sentry.browser.config.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, { encoding: "utf-8" });
      expect(content).toContain(`from "@sentry/solid"`);
    },
    vue: async () => {
      {
        const filePath = path.join(process.cwd(), "sentry.browser.config.ts");
        expect(existsSync(filePath)).toBe(true);
        const content = readFileSync(filePath, { encoding: "utf-8" });
        expect(content).toContain(`from "@sentry/vue"`);
        expect(content).toContain(`app: usePageContext().app`);
      }
      {
        const filePath = path.join(process.cwd(), "layouts", "LayoutDefault.vue");
        expect(existsSync(filePath)).toBe(true);
        const content = readFileSync(filePath, { encoding: "utf-8" });
        expect(content).toContain(`sentryBrowserConfig`);
      }
    },
    _: async () => {
      const filePath = path.join(process.cwd(), "sentry.browser.config.ts");
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, { encoding: "utf-8" });
      expect(content).toContain(`from "@sentry/browser"`);
    },
  });

  testMatch<typeof matrix>("pages/sentry/+Page.<vue/tsx/js", {
    vue: async () => {
      const filePath = path.join(process.cwd(), "pages", "sentry", "+Page.vue");
      expect(existsSync(filePath)).toBe(true);
    },
    react: async () => {
      const filePath = path.join(process.cwd(), "pages", "sentry", "+Page.tsx");
      expect(existsSync(filePath)).toBe(true);
    },
    solid: async () => {
      const filePath = path.join(process.cwd(), "pages", "sentry", "+Page.tsx");
      expect(existsSync(filePath)).toBe(true);
    },
    _: async () => {
      {
        const filePath = path.join(process.cwd(), "pages", "sentry", "+Page.js");
        expect(existsSync(filePath)).toBe(true);
      }
      {
        const filePath = path.join(process.cwd(), "pages", "sentry", "+client.js");
        expect(existsSync(filePath)).toBe(true);
      }
    },
  });
});
