import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  const vikeOptions = props.meta.BATI.has("vercel")
    ? {
        prerender: true,
      }
    : {};
  // See https://github.com/batijs/bati/pull/124
  const reactOptions = props.meta.BATI.has("vercel") && props.meta.BATI.has("hattip") ? { jsxRuntime: "classic" } : {};

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
    options: reactOptions,
  });
  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "ssr",
    options: vikeOptions,
  });

  return mod.generate().code;
}
