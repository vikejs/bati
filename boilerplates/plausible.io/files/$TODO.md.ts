import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const headFileName = props.meta.BATI.has("vue") ? "+Head.vue" : "+Head.tsx";

  //language=Markdown
  const todo = `
## *plausible.io*
Update \`pages/${headFileName}\` to properly set \`data-domain\` or replace the script with the one from your Plausible account.

`;

  content.addMarkdownFeature(todo, "plausible.io");

  return content;
}
