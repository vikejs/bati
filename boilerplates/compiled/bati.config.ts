import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("compiled-css");
  },
  knip: {
    ignore: ["vite.config.ts"],
    ignoreDependencies: ["@compiled/react", "@vitejs/plugin-react", "vite-plugin-compiled-react"],
    vite: false,
  },
  // Styling skill.
  skills() {
    return [
      {
        name: "styling",
        description: "How styling works in this app (Compiled CSS-in-JS). Use when styling a component.",
        body: `This app uses Compiled (\`@compiled/react\`) for CSS-in-JS; styles are extracted at build time by the Vite plugin (already configured).

- **Style components:** pass a \`css={{ ... }}\` prop with an object of CSS properties, e.g. \`<div css={{ fontWeight: "700", fontSize: "1.875rem" }} />\`.
- Styles are colocated with components; there is no global utility framework.

See https://compiledcssinjs.com.`,
      },
    ];
  },
});
