import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);
  let options: Record<string, unknown> | undefined = undefined;

  if (props.meta.BATI.has("vercel")) {
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
