import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  // See https://github.com/vikejs/bati/pull/124
  const reactOptions = props.meta.BATI.has("vercel") && props.meta.BATI.has("hattip") ? { jsxRuntime: "classic" } : {};

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
    options: reactOptions,
  });

  return mod.generate().code;
}
