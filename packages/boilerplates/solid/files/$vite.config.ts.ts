import { loadAsMagicast } from "@batijs/core";
import type { MaybeContentGetter } from "@batijs/core";
// @ts-ignore node16 import syntax only for this package
import { addVitePlugin } from "magicast/helpers";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "solide/vite",
    constructor: "solid",
  });

  return mod.generate().code;
}
