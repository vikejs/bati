import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  enforce: "post",
  if(_, pm) {
    return pm === "pnpm";
  },
});
