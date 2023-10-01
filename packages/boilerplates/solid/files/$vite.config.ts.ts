import { addVitePlugin, loadAsMagicast, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

export default async function getViteConfig(currentContent: MaybeContentGetter, meta: VikeMeta) {
  const mod = await loadAsMagicast(currentContent);
  let options: Record<string, unknown> | undefined = undefined;

  if (meta.BATI_MODULES?.some((m) => m === "hosting:vercel")) {
    options = {
      vps: {
        prerender: true,
      },
    };
  }

  addVitePlugin(mod, {
    from: "vike-solid/vite",
    constructor: "solid",
    options,
  });

  return mod.generate().code;
}
