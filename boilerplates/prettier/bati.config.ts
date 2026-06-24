import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prettier");
  },
  knip: {
    ignoreDependencies: ["prettier", "eslint-config-prettier"],
  },
  // Formatter skill.
  skills(meta) {
    const exec = meta.BATI.pmExec;
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
