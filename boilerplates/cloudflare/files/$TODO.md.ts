import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## Cloudflare Workers

Run [\`wrangler types\`](https://developers.cloudflare.com/workers/wrangler/commands/#types) to generate the \`worker-configuration.d.ts\` file.

Then commit \`worker-configuration.d.ts\`:

\`\`\`bash
git commit -am "add cloudflare types"
\`\`\`

> Re-run it after changing your Cloudflare configuration to update \`worker-configuration.d.ts\`.

See also: https://vike.dev/cloudflare#typescript
`;

  content.addMarkdownFeature(todo, "cloudflare");

  return content;
}
