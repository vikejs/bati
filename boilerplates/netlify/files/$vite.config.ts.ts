import { addVitePlugin, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "@netlify/vite-plugin",
    constructor: "netlify",
    options: {
      build: {
        enabled: true,
      },
    },
  });

  addVitePlugin(mod, {
    from: "@universal-deploy/netlify/vite",
    constructor: "netlifyCompat",
  });

  return mod.generate().code;
}
