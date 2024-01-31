import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);
  const flags = Array.from(props.meta.BATI)
    .map((f) => `--${f}`)
    .join(" ");

  //language=Markdown
  const intro = `This app have been created with [Bati](https://batijs.github.io) using the following flags: \`${flags}\``;

  content.addIntro(intro);

  return content.finalize();
}
