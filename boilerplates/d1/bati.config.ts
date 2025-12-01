import { type BatiConfigStep, defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.hasD1;
  },
  nextSteps(meta, packageManager) {
    const step: BatiConfigStep = {
      type: "command",
      step: `${packageManager} wrangler d1 create my-vike-demo-database`,
    };

    if (!meta.BATI.has("drizzle")) {
      return [
        step,
        {
          type: "command",
          step: `${packageManager} d1:migrate`,
        },
      ];
    }

    return [step];
  },
});
