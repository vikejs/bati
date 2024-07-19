import { getArgs, getVersion, loadReadme, markdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);
  const flags = Array.from(props.meta.BATI)
    .filter((f) => (f as string) !== "force")
    .map((f) => `--${f}`)
    .join(" ");
  const v = getVersion();

  //language=Markdown
  const intro = `Generated with [Bati](https://batijs.dev) ${v ? `(${markdown.link("https://www.npmjs.com/package/@batijs/create-app/v/" + v.version, "version " + v.semver.at(-1))})` : ""} using this command:

\`\`\`sh
${getArgs()} ${flags}
\`\`\`
  `;

  content.addIntro(intro);

  return content.finalize();
}
