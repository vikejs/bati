import { parseModule } from "magicast";
// @ts-ignore node16 import syntax only for this package
import { addVitePlugin } from "magicast/helpers";

export default async function getViteConfig(currentContent: (() => string | Promise<string>) | undefined) {
  const content = await currentContent?.();

  if (typeof content !== "string") {
    throw new Error("TODO");
  }

  const mod = await parseModule(content);

  addVitePlugin(mod, {
    from: "telefunc/vite",
    constructor: "telefunc",
    imported: "telefunc",
  });

  return mod.generate().code;
}
