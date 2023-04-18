import { loadFile } from "magicast";
import { addVitePlugin } from "magicast/helpers";
import { getSharedFilePath } from "../src/utils.js";

export default async function getViteConfig() {
  const mod = await loadFile(getSharedFilePath(import.meta));

  mod.imports.$items;

  addVitePlugin(mod, {
    from: "solide/vite",
    constructor: "solid",
  });

  return mod.generate().code;
}
