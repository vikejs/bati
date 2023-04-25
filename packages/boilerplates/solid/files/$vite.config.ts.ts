import { addVitePlugin, loadAsMagicast } from "@batijs/core";
import type { MaybeContentGetter } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "solide/vite",
    constructor: "solid",
  });

  return mod.generate().code;
}
