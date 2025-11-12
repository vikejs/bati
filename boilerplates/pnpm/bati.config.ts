import { defineConfig } from "@batijs/core";

export default defineConfig({
  enforce: "post",
  if(_, pm) {
    return pm === "pnpm";
  },
});
