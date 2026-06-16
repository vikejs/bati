import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prettier");
  },
  knip: {
    ignoreDependencies: ["prettier", "eslint-config-prettier"],
  },
  // Formatter skill (SKILLS_PLAN.md §6.L).
  skills(meta) {
    const pm = meta.BATI.pm;
    const exec = pm === "pnpm" ? "pnpm exec" : pm === "yarn" ? "yarn" : pm === "bun" ? "bunx" : "npx";
    return [
      {
        name: "prettier",
        description:
          "How formatting works in this app (Prettier). Use when formatting code or adjusting formatting rules.",
        body: `Prettier handles code formatting (config in \`prettier.config.js\`).

- **Format:** \`${exec} prettier --write .\`.
- **Rules:** edit \`prettier.config.js\`.

See https://prettier.io/docs.`,
      },
    ];
  },
});
