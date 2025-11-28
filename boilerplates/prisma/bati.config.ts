import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("prisma");
  },
  nextSteps(_meta, packageManager) {
    return [
      {
        type: "command",
        step: `${packageManager} prisma init --db`,
      },
      {
        type: "text",
        step: `Then follow instructions at https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres`,
      },
    ];
  },
});
