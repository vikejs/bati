import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *Sqlite*

First, ensure that \`DATABASE_URL\` is configured in \`.env\` file, then create the database:
\`\`\`bash
pnpm sqlite:migrate # creates sqlite tables
\`\`\`
`;

  content.addTodo(todo);

  return content.finalize();
}
