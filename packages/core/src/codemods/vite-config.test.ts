import { defineCodemod } from "@codegraft/codemod";
import type { Collection } from "@codegraft/core";
import { describe, expect, it } from "vitest";
import { addVitePlugin, defineConfigArg, mergeObject } from "./vite-config.js";

const build = (fn: (root: Collection) => void) => defineCodemod(fn).forTarget("typescript");
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

const config = (body: string) =>
  `import vike from "vike/plugin"\nimport { defineConfig } from "vite"\n\nexport default defineConfig({\n${body}\n})\n`;

describe("addVitePlugin", () => {
  it("appends the plugin to the array and ensures its import", async () => {
    const t = await build((root) => addVitePlugin(root, { from: "@vitejs/plugin-react", constructor: "react" }));
    const out = t.transform(config("  plugins: [vike()],"), {});
    expect(out).toContain('import react from "@vitejs/plugin-react"');
    expect(out).toContain("plugins: [vike(), react()]");
  });

  it("is idempotent — re-running adds neither a duplicate plugin nor a duplicate import", async () => {
    const t = await build((root) => addVitePlugin(root, { from: "@vitejs/plugin-react", constructor: "react" }));
    const once = t.transform(config("  plugins: [vike()],"), {});
    expect(t.transform(once, {})).toBe(once);
  });

  it("supports a named import and constructor options", async () => {
    const t = await build((root) =>
      addVitePlugin(root, {
        from: "@sentry/vite-plugin",
        constructor: "sentryVitePlugin",
        named: true,
        options: '{ org: "o" }',
      }),
    );
    const out = t.transform(config("  plugins: [vike()],"), {});
    expect(out).toContain('import { sentryVitePlugin } from "@sentry/vite-plugin"');
    expect(out).toContain('sentryVitePlugin({ org: "o" })');
  });

  it("does nothing when there is no plugins array (no orphan import)", async () => {
    const t = await build((root) => addVitePlugin(root, { from: "@vitejs/plugin-react", constructor: "react" }));
    const base = config("  build: {},");
    expect(t.transform(base, {})).toBe(base);
  });
});

describe("mergeObject (deepMergeObject)", () => {
  it("appends an absent key", async () => {
    const t = await build((root) => mergeObject(defineConfigArg(root), { build: { sourcemap: "true" } }));
    expect(norm(t.transform(config("  plugins: [vike()],"), {}))).toContain("build: { sourcemap: true }");
  });

  it("recurses into an existing nested object, keeping its siblings", async () => {
    const t = await build((root) => mergeObject(defineConfigArg(root), { build: { sourcemap: "true" } }));
    const out = norm(t.transform(config('  plugins: [vike()],\n  build: { rollupOptions: { external: ["x"] } },'), {}));
    expect(out).toContain('rollupOptions: { external: ["x"] }');
    expect(out).toContain("sourcemap: true");
  });

  it("merges a nested object with a quoted key and an expression value (shadcn alias)", async () => {
    const t = await build((root) =>
      mergeObject(defineConfigArg(root), { resolve: { alias: { "@": 'new URL("./src", import.meta.url).pathname' } } }),
    );
    const out = norm(t.transform(config("  plugins: [vike()],\n  resolve: { alias: {} },"), {}));
    expect(out).toContain('"@": new URL("./src", import.meta.url).pathname');
  });

  it("replaces a leaf value", async () => {
    const t = await build((root) => mergeObject(defineConfigArg(root), { build: { sourcemap: "false" } }));
    const out = norm(t.transform(config("  build: { sourcemap: true },"), {}));
    expect(out).toContain("sourcemap: false");
    expect(out).not.toContain("sourcemap: true");
  });
});

describe("import + statement injection (reuse core primitives)", () => {
  it("prepends an import and injects a call before the default export", async () => {
    const t = await build((root) => {
      root.ensureImport('import { sentryBrowserConfig } from "../sentry.browser.config"');
      root.find("export_statement").first().insertBefore("sentryBrowserConfig()\n\n");
    });
    const out = t.transform("export default function onRenderClient() {}\n", {});
    expect(out).toContain('import { sentryBrowserConfig } from "../sentry.browser.config"');
    expect(out).toMatch(/sentryBrowserConfig\(\)\s*\n\s*export default/);
  });
});
