import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("eslint");
  },
  knip: {
    ignoreDependencies: ["eslint"],
  },
  // Linter skill (SKILLS_PLAN.md §6.L).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    return [
      {
        name: "eslint",
        description: "How linting works in this app (ESLint). Use when running the linter or adjusting lint rules.",
        body: `ESLint with a flat config in \`eslint.config.ts\`.

- **Lint:** \`${run} lint\` (\`eslint .\`).
- **Rules:** edit \`eslint.config.ts\`.

See https://eslint.org.`,
      },
    ];
  },
});
