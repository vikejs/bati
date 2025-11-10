import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  // DATABASE_URL is only required when using standard sqlite
  if (props.meta.BATI.hasD1) return;

  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Sqlite*

Ensure that \`DATABASE_URL\` is configured in \`.env\` file, then create the database:
\`\`\`bash
pnpm sqlite:migrate # creates sqlite tables
\`\`\`
`;

  content.addMarkdownFeature(todo, "sqlite");

  return content;
}
