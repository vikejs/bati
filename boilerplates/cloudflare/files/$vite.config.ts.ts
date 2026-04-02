import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "@cloudflare/vite-plugin",
    constructor: "cloudflare",
    imported: "cloudflare",
    options: {
      viteEnvironment: { name: "ssr" },
    },
  });

  return mod.generate().code;
}
