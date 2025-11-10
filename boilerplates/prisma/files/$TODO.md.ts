import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Prisma*
Run the following command once:
\`\`\`sh
pnpx prisma init
\`\`\`

then follow instructions at <https://www.prisma.io/docs/getting-started/quickstart#2-model-your-data-in-the-prisma-schema>`;

  content.addMarkdownFeature(todo, "prisma", {
    position: "before",
  });

  return content;
}
