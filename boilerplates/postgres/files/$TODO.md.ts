import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps): Promise<unknown> {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  const serverNote = props.meta.BATI.has("docker")
    ? "The Docker setup provisions a PostgreSQL server for you via `docker-compose.yml`."
    : "Bati only installs the `postgres` client — **bring your own PostgreSQL server** (a local install, a managed instance, or e.g. `docker run -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres`).";

  //language=Markdown
  const todo = `
## PostgreSQL

${serverNote}

Set \`DATABASE_URL\` in \`.env\` to your connection string, then create the example table:
\`\`\`bash
${pmCmd} postgres:migrate # creates the \`todos\` table
\`\`\`

Queries use [postgres.js](https://github.com/porsager/postgres). See \`database/postgres/\` for the
client, schema and example queries.
`;

  content.addMarkdownFeature(todo, "postgres");

  return content;
}
