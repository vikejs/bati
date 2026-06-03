import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps): Promise<unknown> {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;
  const provider = props.meta.BATI.has("postgres") ? "postgresql" : "sqlite";

  //language=Markdown
  const todo = `
## Prisma

Scaffold your Prisma schema (uses the \`DATABASE_URL\` already set in \`.env\`):
\`\`\`sh
${pmCmd} prisma init --datasource-provider ${provider}
\`\`\`

Then define your models and run \`${pmCmd} prisma migrate dev\`. See <https://www.prisma.io/docs/getting-started>`;

  content.addMarkdownFeature(todo, "prisma");

  return content;
}
