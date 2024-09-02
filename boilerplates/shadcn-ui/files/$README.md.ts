import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

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

  **Example:** add the calendar component to your project.
  \`pnpm shadcn add calendar\`

  more [shadcn/ui components](https://ui.shadcn.com/docs/components/accordion)

`;

  content.addAbout(about);

  return content.finalize();
}
