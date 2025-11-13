import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  //language=Markdown
  const todo = `
## Cloudflare D1

Create the \`my-vike-demo-database\` database:
\`\`\`sh
${pmCmd} wrangler d1 create my-vike-demo-database
\`\`\`

Then migrate:
\`\`\`sh
${pmCmd} ${props.meta.BATI.has("drizzle") ? "drizzle" : "d1"}:migrate
\`\`\`

More infos can be found at https://developers.cloudflare.com/d1/get-started/
`;

  content.addMarkdownFeature(todo, "sqlite");

  return content;
}
