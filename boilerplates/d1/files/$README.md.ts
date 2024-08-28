import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const todo = `
## *Cloudflare D1*
### Setup
Create a D1 database:

\`\`\`sh
wrangler d1 create <your-db-name>
\`\`\`

> [!NOTE]
> For reference, a good database name is:
> - Typically a combination of ASCII characters, shorter than 32 characters, and uses dashes (-) instead of spaces.
> - Descriptive of the use-case and environment. For example, “staging-db-web” or “production-db-backend”.
> - Only used for describing the database, and is not directly referenced in code.

Then copy the output to \`wrangler.toml\``;

  content.addTodo(todo);

  return content.finalize();
}
