import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Drizzle*

First, ensure that \`DATABASE_URL\` is configured in \`.env\` file, then create the database:
\`\`\`bash
pnpm drizzle:generate # a script that executes drizzle-kit generate.
pnpm drizzle:migrate # a script that executes drizzle-kit migrate.
\`\`\`

> [!NOTE]
> The \`drizzle-kit generate\` command is used to generate SQL migration files based on your Drizzle schema.
>
> The \`drizzle-kit migrate\` command is used to apply the generated migrations to your database.

Read more on [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)
`;

  content.addMarkdownFeature(todo, "drizzle");

  return content;
}
