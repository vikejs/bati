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
});
