import type { MaybeContentGetter } from "@batijs/core";
import { addVitePlugin, loadAsMagicast } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "vike-solid/vite",
    constructor: "solid",
  });

  return mod.generate().code;
}
