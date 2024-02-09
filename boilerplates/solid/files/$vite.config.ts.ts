import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  // eslint-disable-next-line solid/reactivity
  const vikeOptions = props.meta.BATI.has("vercel")
    ? {
        prerender: true,
      }
    : {};

  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "vike",
    options: vikeOptions,
  });
  addVitePlugin(mod, {
    from: "vike-solid/vite",
    constructor: "vikeSolid",
  });

  return mod.generate().code;
}
