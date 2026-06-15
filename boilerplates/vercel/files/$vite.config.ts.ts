import { addVitePlugin, type TransformerProps, transformConfig } from "@batijs/core";

export default function getViteConfig(props: TransformerProps): Promise<unknown> {
  return transformConfig(props, (root) => {
    addVitePlugin(root, {
      from: "vite-plugin-vercel/vite",
      constructor: "vercel",
      named: true,
    });
  });
}
