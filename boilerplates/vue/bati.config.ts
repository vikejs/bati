import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("vue");
  },
  knip: {
    ignoreDependencies: ["@vue/.+"],
  },
  // UI-framework conventions skill (SKILLS_PLAN.md §6.C).
  skills() {
    return [
      {
        name: "ui-framework",
        description: "Vue conventions in this app. Use when writing components or handling SSR/hydration.",
        body: `This app renders with Vue via \`vike-vue\`. Components are Single-File Components (\`.vue\`).

- **SSR-safe:** components render on the server first — run browser-only code inside \`onMounted\` and guard \`window\`/\`document\` access to avoid hydration mismatches.
- **Page data:** read it with \`useData()\` (see the \`vike-data-fetching\` skill).

See https://vike.dev/vue.`,
      },
    ];
  },
});
