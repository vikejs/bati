import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  let options: Parameters<typeof addVitePlugin>[1]["options"] = undefined;

  if (props.meta.BATI.has("hattip") || props.meta.BATI.has("hono")) {
    options = {
      server: {
        kind: props.meta.BATI.has("hono") ? "hono" : "hattip",
        entry: props.meta.BATI.has("hono") ? "hono-entry.ts" : "hattip-entry.ts",
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
