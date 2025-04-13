import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const todo = `
## *Kysely*

`;

  content.addMarkdownFeature(todo, "kysely");

  return content;
}
