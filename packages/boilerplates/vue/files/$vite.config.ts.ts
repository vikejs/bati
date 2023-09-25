import type { MaybeContentGetter } from "@batijs/core";
import { addVitePlugin, loadAsMagicast } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

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
