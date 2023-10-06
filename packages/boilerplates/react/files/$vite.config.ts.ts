import { addVitePlugin, loadAsMagicast, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

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
    // see https://github.com/vitejs/vite/discussions/5803#discussioncomment-5562200
    options: { jsxRuntime: "classic" },
  });
  addVitePlugin(mod, {
    from: "vike/plugin",
    constructor: "ssr",
    options,
  });

  return mod.generate().code;
}
