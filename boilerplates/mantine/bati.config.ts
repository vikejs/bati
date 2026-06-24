import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  enforce: "post",
  if(meta) {
    return meta.BATI.has("mantine") && meta.BATI.has("react");
  },
  knip: {
    ignoreDependencies: ["postcss"],
  },
  // UI component library skill.
  skills() {
    return [
      {
        name: "mantine",
        description: "How to use Mantine components in this app. Use when building UI with Mantine.",
        body: `Mantine (React). \`MantineProvider\` wraps the app in \`pages/+Layout.tsx\`; global styles are in \`pages/Layout.css\`; PostCSS is set up in \`postcss.config.cjs\`.

- **Use a component:** import from \`@mantine/core\` (or another \`@mantine/*\` package) and render it inside the provider.
- **Theme:** pass a theme to \`MantineProvider\` in \`pages/+Layout.tsx\`.

See https://mantine.dev.`,
      },
    ];
  },
});
