import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("oxlint");
  },
  knip: {
    // When multiple linters are selected, only one `lint` script wins (precedence
    // is 0 across linter boilerplates), so the other linters' binaries look unused
    // to knip. `oxlint-tsgolint` is also loaded via the oxlint config rather than
    // via a script, so knip can never detect its usage automatically — it always
    // needs an explicit ignore.
    ignoreDependencies: ["oxlint", "oxlint-tsgolint"],
  },
  // Linter skill.
  skills(meta) {
    const run = meta.BATI.pmRun;
    return [
      {
        name: "oxlint",
        description: "How linting works in this app (Oxlint). Use when running the linter or adjusting lint rules.",
        body: `Oxlint — a fast Rust-based linter (config in \`.oxlintrc.json\`).

- **Lint:** \`${run} lint\` (\`oxlint --type-aware\`).
- **Rules:** edit \`.oxlintrc.json\`.

See https://oxc.rs/docs/guide/usage/linter.html.`,
      },
    ];
  },
});
