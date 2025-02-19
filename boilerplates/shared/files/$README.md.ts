import { getArgs, getVersion, loadMarkdown, markdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const flags = Array.from(props.meta.BATI)
    .filter((f) => (f as string) !== "force")
    .map((f) => `--${f}`)
    .join(" ");
  const v = getVersion();

  //language=Markdown
  const intro = `Generated with [vike.dev/new](https://vike.dev/new) ${`(${markdown.link("https://www.npmjs.com/package/create-vike/v/" + v.version, "version " + v.semver.at(-1))})`} using this command:

\`\`\`sh
${getArgs()} ${flags}
\`\`\`
  `;

  content.addMarkdown(intro, {
    wrapper: {
      section: "intro",
    },
  });
  content.addMarkdown("", {
    position: "after",
    filter: {
      section: "intro",
    },
    wrapper: {
      section: "TOC",
    },
  });
  content.addMarkdown("", {
    position: "after",
    filter: {
      section: "document",
    },
    wrapper: {
      section: "features",
    },
  });

  return content;
}
