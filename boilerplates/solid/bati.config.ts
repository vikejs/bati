import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("solid");
  },
  // UI-framework conventions skill (SKILLS_PLAN.md §6.C).
  skills() {
    return [
      {
        name: "ui-framework",
        description: "Solid conventions in this app. Use when writing components or handling SSR/hydration.",
        body: `This app renders with SolidJS via \`vike-solid\`. Components are \`.tsx\` files built around Solid signals.

- **SSR-safe:** components render on the server first — run browser-only code inside \`onMount\` and guard \`window\`/\`document\` access to avoid hydration mismatches.
- **Page data:** read it with \`useData()\` (see the \`vike-data-fetching\` skill).

See https://vike.dev/solid.`,
      },
    ];
  },
});
