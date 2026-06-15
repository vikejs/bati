import { addVitePlugin, type TransformerProps, transformConfig } from "@batijs/core";

export default function getViteConfig(props: TransformerProps): Promise<unknown> | undefined {
  if (props.meta.BATI.hasD1) return;
  return transformConfig(props, (root) => {
    addVitePlugin(root, {
      from: "./vite-plugin-input.js",
      constructor: "inputPlugin",
      named: true,
      options: `{ name: "migrate", entry: "database/kysely/migrate.ts" }`,
    });
  });
}
