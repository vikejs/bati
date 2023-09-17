import { addVitePlugin, loadAsMagicast, type MaybeContentGetter } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "vite-plugin-vercel",
    constructor: "vercel",
  });

  return mod.generate().code;
}
