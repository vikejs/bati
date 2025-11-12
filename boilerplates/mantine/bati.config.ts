import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  enforce: "post",
  if(meta) {
    return meta.BATI.has("mantine") && meta.BATI.has("react");
  },
});
