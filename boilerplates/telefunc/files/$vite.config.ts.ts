import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "telefunc/vite",
    constructor: "telefunc",
    imported: "telefunc",
  });

  return mod.generate().code;
}
