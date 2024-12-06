import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Cloudflare D1*

### Setup
Create a D1 database with the following command:
\`\`\`sh
wrangler d1 create <your-db-name>
\`\`\`

Then, copy the output to \`wrangler.toml\`.

Finally, update the \`d1:migrate\` script (in \`package.json\`) to replace \`YOUR_DATABASE_NAME\`, and execute it.

> [!NOTE]
> For reference, a good database name is:
> - Typically a combination of ASCII characters, shorter than 32 characters, and uses dashes (-) instead of spaces.
> - Descriptive of the use-case and environment. For example, “staging-db-web” or “production-db-backend”.
> - Only used for describing the database, and is not directly referenced in code.
`;

  content.addMarkdownFeature(todo, "sqlite", {
    position: "before",
  });

  return content;
}
