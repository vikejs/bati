import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "@edgeone/vite",
    constructor: "edgeone",
  });

  return mod.generate().code;
}
