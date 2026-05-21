import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta, pm) {
    return meta.BATI.has("sqlite") && pm === "bun";
  },
  enforce: "post",
});
