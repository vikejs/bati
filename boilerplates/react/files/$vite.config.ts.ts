import {
  addVitePlugin,
  loadAsMagicast,
  deepMergeObject,
  generateCode,
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

    // add dotenv to load environment variables from `.env` file
    mod.imports.$add({
      from: "dotenv",
      imported: "config",
    });

    const e = builders.functionCall("config");
    const c = generateCode(e).code;
    //@ts-ignore
    mod.$ast.body.splice(mod.$ast.body.length - 1, 0, c);

    addVitePlugin(mod, {
      from: "@sentry/vite-plugin",
      constructor: "sentryVitePlugin",
      imported: "sentryVitePlugin",
      options: {
        org: builders.raw("process.env.SENTRY_ORG"),
        project: builders.raw("process.env.SENTRY_PROJECT"),
        authToken: builders.raw("process.env.SENTRY_AUTH_TOKEN"),
        sourcemaps: { disable: props.meta.BATI.has("aws-lambda-serverless") ? true : false },
      },
    });

    // activate sourcemaps
    //@ts-ignore
    deepMergeObject(mod.exports.default.$args[0], { build: { sourcemap: true } });
  }

  return mod.generate().code;
}
