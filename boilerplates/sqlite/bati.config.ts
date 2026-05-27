import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("sqlite") && !meta.BATI.has("cloudflare");
  },
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} sqlite:migrate`,
      },
    ];
  },
});
