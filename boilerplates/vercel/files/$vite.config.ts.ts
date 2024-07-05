import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  const options =
    props.meta.BATI.has("express") || props.meta.BATI.has("fastify")
      ? {
          source: "/.*",
        }
      : undefined;

  addVitePlugin(mod, {
    from: "vite-plugin-vercel",
    constructor: "vercel",
    options,
  });

  return mod.generate().code;
}
