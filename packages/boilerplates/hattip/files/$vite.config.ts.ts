import type { MaybeContentGetter } from "@batijs/core";
import { addVitePlugin, loadAsMagicast } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "@hattip/vite",
    imported: "hattip",
    constructor: "hattip",
  });

  return mod.generate().code;
}
