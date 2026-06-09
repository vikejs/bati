import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  // No `if` gate: this is a library boilerplate whose files are pulled in purely by the import
  // graph (every file carries `include-if-imported`), so it only contributes code when a selected
  // boilerplate actually imports `@batijs/shared-env/server/{load,env}`.
  enforce: "pre",
});
