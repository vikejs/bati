import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## Mantine

This is a boilerplate for Mantine based on the [Getting Started](https://mantine.dev/docs/getting-started/) guide.

The following Packages are installed:
* \`@mantine/hooks\` Hooks for state and UI management
* \`@mantine/core\` Core components library: inputs, buttons, overlays, etc.

If you add more packages, make sure to update the \`layouts/LayoutDefault.tsx\` file to include the required CSSs.

The theme is defined in \`layouts/theme.ts\`.
`;

  content.addMarkdownFeature(todo, "mantine");

  return content;
}
