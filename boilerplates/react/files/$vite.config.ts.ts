import {
  addVitePlugin,
  loadAsMagicast,
  deepMergeObject,
  findVitePluginCall,
  builders,
  type TransformerProps,
} from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  // See https://github.com/vikejs/bati/pull/124
  const reactOptions = props.meta.BATI.has("vercel") && props.meta.BATI.has("hattip") ? { jsxRuntime: "classic" } : {};

  addVitePlugin(mod, {
    from: "@vitejs/plugin-react",
    constructor: "react",
    options: reactOptions,
  });

  if (props.meta.BATI.has("sentry")) {
    // load app level environment variables from `.env` file

    // add loadEnv to import `import { defineConfig, loadEnv } from 'vite';`
    mod.imports.$add({
      from: "vite",
      imported: "loadEnv",
    });

    // not implemented yet adding mode to the function call
    // https://github.com/unjs/community/discussions/25
    // export default ({ mode }) => {
    // process.env = {...process.env, ...loadEnv(mode, process.cwd())};


    addVitePlugin(mod, {
      from: "@sentry/vite-plugin",
      constructor: "sentryVitePlugin",
      imported: "sentryVitePlugin",
      options: {
        org: "process.env.SENTRY_ORG",
        project: "process.env.SENTRY_PROJECT",
        authToken: "process.env.SENTRY_AUTH_TOKEN",
      },
    });

    // fix convert "process.env.SENTRY_ORG" to process.env.SENTRY_ORG
    const sentryPlugin = findVitePluginCall(mod, { from: "@sentry/vite-plugin", imported: "sentryVitePlugin" });
    sentryPlugin.$args[0].org = builders.raw("process.env.SENTRY_ORG");
    sentryPlugin.$args[0].project = builders.raw("process.env.SENTRY_PROJECT");
    sentryPlugin.$args[0].authToken = builders.raw("process.env.SENTRY_AUTH_TOKEN");

    // activate sourcemaps
    deepMergeObject(mod.exports.default.$args[0], { build: { sourcemap: true } });
  }

  return mod.generate().code;
}
