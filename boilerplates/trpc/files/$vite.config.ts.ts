import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "./trpc/vite-plugin",
    constructor: "trpc",
  });

  return mod.generate().code;
}
