import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("biome");
  },
  knip: {
    ignoreDependencies: ["@biomejs/biome"],
  },
  // Linter/formatter skill.
  skills(meta) {
    const run = meta.BATI.pmRun;
    return [
      {
        name: "biome",
        description:
          "How linting and formatting work in this app (Biome). Use when running lint/format or adjusting rules.",
        body: `Biome handles both linting and formatting (config in \`biome.json\`).

- **Lint:** \`${run} lint\` (\`biome lint --write .\`).
- **Format:** \`${run} format\` (\`biome format --write .\`).
- **Rules:** edit \`biome.json\`.

See https://biomejs.dev.`,
      },
    ];
  },
});
