import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  if (props.meta.BATI.hasD1) return;
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "./vite-plugin-input.js",
    constructor: "inputPlugin",
    imported: "inputPlugin",
    options: {
      name: "migrate",
      entry: "database/kysely/migrate.ts",
    },
  });

  return mod.generate().code;
}
