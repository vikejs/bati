import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## Cloudflare D1

Create the \`my-vike-demo-database\` database:
\`\`\`sh
pnpm wrangler d1 create my-vike-demo-database
\`\`\`

Then migrate:
\`\`\`sh
pnpm ${props.meta.BATI.has("drizzle") ? "drizzle" : "d1"}:migrate
\`\`\`

More infos can be found at https://developers.cloudflare.com/d1/get-started/
`;

  content.addMarkdownFeature(todo, "sqlite");

  return content;
}
