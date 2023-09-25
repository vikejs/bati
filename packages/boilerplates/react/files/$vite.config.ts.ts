import type { MaybeContentGetter, VikeMeta } from "@batijs/core";
import { addVitePlugin, loadAsMagicast } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const mod = await loadAsMagicast(currentContent);

  const options = meta.BATI_MODULES?.includes("hosting:vercel")
    ? {
        prerender: true,
      }
    : {};

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
  });
  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "ssr",
    options,
  });

  return mod.generate().code;
}
