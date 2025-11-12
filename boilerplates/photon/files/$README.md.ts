import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const photon = `
## Photon
[Photon](https://photonjs.dev) is a next-generation server and deployment toolkit.
It supports popular deployments ([self-hosted](https://photonjs.dev/self-hosted), [Cloudflare](https://photonjs.dev/cloudflare), [Vercel](https://photonjs.dev/vercel), and [more](https://photonjs.dev/deploy))
and popular servers ([Hono](https://photonjs.dev/hono), [Express](https://photonjs.dev/express), [Fastify](https://photonjs.dev/fastify), and [more](https://photonjs.dev/server)).
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
