import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  const options = props.meta.BATI.has("vercel")
    ? {
        prerender: true,
      }
    : {};

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
    // see https://github.com/vitejs/vite/discussions/5803#discussioncomment-5562200
    options: {},
  });
  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "ssr",
    options,
  });

  return mod.generate().code;
}
