import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  // DATABASE_URL is only required when using standard sqlite
  if (props.meta.BATI.hasD1) return;

  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  //language=Markdown
  const todo = `
## Kysely

Ensure that \`DATABASE_URL\` is configured as desired in \`.env\` file, then create the database:
\`\`\`bash
${pmCmd} kysely:migrate # creates kysely tables
\`\`\`
`;

  content.addMarkdownFeature(todo, "kysely");

  return content;
}
