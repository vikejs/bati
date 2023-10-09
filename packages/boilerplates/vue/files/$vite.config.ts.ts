import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "ssr",
  });
  addVitePlugin(mod, {
    from: "@vitejs/plugin-vue",
    constructor: "vue",
    options: {
      include: [/\.vue$/, /\.md$/],
    },
  });
  addVitePlugin(mod, {
    from: "unplugin-vue-markdown/vite",
    constructor: "md",
    options: {},
  });

  return mod.generate().code;
}
