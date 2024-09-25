import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const about = `
  
  ## shadcn/ui

  Beautifully designed components that you can copy and paste into your apps. Accessible. Customizable. Open Source.

  ### Configuration

  see [shadcn/ui theming](https://ui.shadcn.com/docs/theming)

  Base Configuration can be found in \`components.json\` file.

  > [!NOTE]
  > changes to the \`components.json\` file **will not** be reflected in existing components. Only new components will be affected.

  ### Add Components to Your Project

  **Example:** add a component to your project.
  \`pnpm shadcn add button\`

  use the \`<Button />\` component in your project:
  \`import { Button } from "@/components/ui/button";\`

  more [shadcn/ui components](https://ui.shadcn.com/docs/components/accordion)

`;

  content.addMarkdownFeature(about, "shadcn-ui");

  return content;
}
