import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  // TODO remove when shadcn supports tailwind v4
  if (props.meta.BATI.has("shadcn-ui")) {
    return;
  }
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "@tailwindcss/vite",
    constructor: "tailwindcss",
  });

  return mod.generate().code;
}
