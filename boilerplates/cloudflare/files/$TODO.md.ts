import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const pmExec = packageManager().exec;

  //language=Markdown
  const todo = `
## Cloudflare Workers

Run [\`wrangler types\`](https://developers.cloudflare.com/workers/wrangler/commands/#types) to generate the \`worker-configuration.d.ts\` file:
\`\`\`sh
${pmExec} wrangler types
\`\`\`

> Re-run it whenever you change your Cloudflare configuration to update \`worker-configuration.d.ts\`.

Then commit \`worker-configuration.d.ts\`:
\`\`\`sh
git commit -am "add cloudflare types"
\`\`\`

See also: https://vike.dev/cloudflare#typescript
`;

  content.addMarkdownFeature(todo, "cloudflare");

  return content;
}
