import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("react");
  },
  knip: {
    ignoreDependencies: ["react-dom", "@types/react-dom"],
  },
  // UI-framework conventions skill (SKILLS_PLAN.md §6.C).
  skills() {
    return [
      {
        name: "ui-framework",
        description: "React conventions in this app. Use when writing components or handling SSR/hydration.",
        body: `This app renders with React via \`vike-react\`. Components are \`.tsx\` files (pages under \`pages/\`, shared ones in \`components/\`).

- **SSR-safe:** components render on the server first — guard browser-only APIs (\`window\`, \`document\`, \`localStorage\`) behind \`useEffect\` or a \`typeof window !== "undefined"\` check to avoid hydration mismatches.
- **Page data:** read it with \`useData()\` (see the \`vike-data-fetching\` skill) rather than fetching in the component body.

See https://vike.dev/react.`,
      },
    ];
  },
});
