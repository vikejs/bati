import { loadAsMagicast, type MaybeContentGetter } from "@batijs/core";
// @ts-ignore node16 import syntax only for this package
import { addVitePlugin } from "magicast/helpers";

export default async function getViteConfig(currentContent: MaybeContentGetter) {
  const mod = await loadAsMagicast(currentContent);

  addVitePlugin(mod, {
    from: "telefunc/vite",
    constructor: "telefunc",
    imported: "telefunc",
  });

  return mod.generate().code;
}
