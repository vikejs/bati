import { loadFile } from "magicast";
// @ts-ignore node16 import syntax only for this package
import { addVitePlugin } from "magicast/helpers";
import { getSharedFilePath } from "../src/utils.js";

export default async function getViteConfig() {
  const mod = await loadFile(getSharedFilePath(import.meta));

  addVitePlugin(mod, {
    from: "solide/vite",
    constructor: "solid",
  });

  return mod.generate().code;
}
