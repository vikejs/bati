import { addVitePlugin, defineConfigArg, mergeObject, transformConfig, type TransformerProps } from "@batijs/core";

export default function getViteConfig(props: TransformerProps): Promise<unknown> {
  return transformConfig(props, (root) => {
    addVitePlugin(root, {
      from: "@sentry/vite-plugin",
      constructor: "sentryVitePlugin",
      named: true,
      options: `{ sourcemaps: { disable: false } }`,
    });

    // activate sourcemaps
    mergeObject(defineConfigArg(root), { build: { sourcemap: "true" } });
  });
}
