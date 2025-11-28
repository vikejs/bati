import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  //language=Markdown
  const todo = `
## Prisma

Run the following command once:
\`\`\`sh
${pmCmd} prisma init --db
\`\`\`

then follow instructions at <https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres#4-initialize-prisma-orm-and-create-a-prisma-postgres-database>`;

  content.addMarkdownFeature(todo, "prisma");

  return content;
}
