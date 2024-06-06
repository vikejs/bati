import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *Drizzle*
- First, ensure all dependencies are installed using your preferred package manager.
- Execute the commands below with your preferred package manager, e.g., for pnpm:
\`\`\`bash
pnpm drizzle:generate # a script that executes drizzle-kit generate.
pnpm drizzle:migrate # a script that executes drizzle-kit migrate.
pnpm drizzle:seed # a script that executes tsx ./database/seed.ts.
\`\`\`

> [!NOTE]
> The \`drizzle-kit generate\` command is used to generate SQL migration files based on your Drizzle schema.
>
> The \`drizzle-kit migrate\` command is used to apply the generated migrations to your database.
>
> The \`tsx ./database/seed.ts\` command is used to run a custom seed script to populate data to your database. 

Read more on [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview)
`;

  content.addTodo(todo);

  return content.finalize();
}
