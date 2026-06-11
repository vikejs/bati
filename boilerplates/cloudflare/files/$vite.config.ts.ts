import { addVitePlugin, transformConfig, type TransformerProps } from "@batijs/core";

export default function getViteConfig(props: TransformerProps): Promise<unknown> {
  return transformConfig(props, (root) => {
    addVitePlugin(root, {
      from: "@cloudflare/vite-plugin",
      constructor: "cloudflare",
      named: true,
      options: `{ viteEnvironment: { name: "ssr" } }`,
    });
  });
}
