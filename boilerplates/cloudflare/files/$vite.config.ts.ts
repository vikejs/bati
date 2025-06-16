import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  let options: Parameters<typeof addVitePlugin>[1]["options"] = undefined;

  if (props.meta.BATI.has("hono")) {
    options = {
      server: {
        kind: "hono",
        entry: "hono-entry.ts",
      },
    };
  }

  addVitePlugin(mod, {
    from: "vike-cloudflare",
    constructor: "pages",
    imported: "pages",
    options,
  });

  return mod.generate().code;
}
