import type { MaybeContentGetter } from "@batijs/core";
import { addVitePlugin, loadAsMagicast } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
  });
  addVitePlugin(mod, {
    from: "vite-plugin-ssr/plugin",
    constructor: "ssr",
  });

  return mod.generate().code;
}
