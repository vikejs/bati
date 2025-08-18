import { addVitePlugin, deepMergeObject, loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  addVitePlugin(mod, {
    from: "@sentry/vite-plugin",
    constructor: "sentryVitePlugin",
    imported: "sentryVitePlugin",
    options: {
      sourcemaps: { disable: false },
    },
  });

  // activate sourcemaps
  //@ts-expect-error
  deepMergeObject(mod.exports.default.$args[0], { build: { sourcemap: true } });

  return mod.generate().code;
}
