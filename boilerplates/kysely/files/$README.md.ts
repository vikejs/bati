import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Kysely*

First, ensure that \`DATABASE_URL\` is configured in \`.env\` file, then create the database:
\`\`\`bash
pnpm kysely:migrate # creates kysely tables
\`\`\`
`;

  content.addMarkdownFeature(todo, "kysely");

  return content;
}
