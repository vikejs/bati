import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "vite-plugin-compiled-react",
    constructor: "compiled",
    imported: "compiled",
    options: { extract: true },
  });

  return mod.generate().code;
}
