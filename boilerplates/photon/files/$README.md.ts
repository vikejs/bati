import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const photon = `
## Photon

[Photon](https://photonjs.dev) is a next-generation infrastructure for deploying JavaScript servers.

See [Introducing Photon](https://vike.dev/blog/photon) and [Why Photon](https://photonjs.dev/why) to learn more.
`;

  content.addMarkdown(photon, {
    filter: {
      section: "features",
    },
    wrapper: {
      category: "Server",
    },
  });

  return content;
}
