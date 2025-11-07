import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const about = `

This app is ready to start. It's powered by [Vike](https://vike.dev) and [React](https://react.dev/learn).

### Plus files

[The + files are the interface](https://vike.dev/config) between Vike and your code.

- [\`+config.ts\`](https://vike.dev/settings) — Settings (e.g. \`<title>\`)
- [\`+Page.tsx\`](https://vike.dev/Page) — The \`<Page>\` component
- [\`+data.ts\`](https://vike.dev/data) — Fetching data (for your \`<Page>\` component)
- [\`+Layout.tsx\`](https://vike.dev/Layout) — The \`<Layout>\` component (wraps your \`<Page>\` components)
- [\`/pages/_error/+Page.tsx\`](https://vike.dev/error-page) — The error page (rendered when an error occurs)
- [\`+onPageTransitionStart.ts\`](https://vike.dev/onPageTransitionStart) and \`+onPageTransitionEnd.ts\` — For page transition animations
- [\`+Head.tsx\`](https://vike.dev/Head) - Sets \`<head>\` tags

### Routing

[Vike's built-in router](https://vike.dev/routing) lets you choose between:
 - [Filesystem Routing](https://vike.dev/filesystem-routing) (the URL of a page is determined based on where its \`+Page.jsx\` file is located on the filesystem)
 - [Route Strings](https://vike.dev/route-string)
 - [Route Functions](https://vike.dev/route-function)

### SSR

SSR is enabled by default. You can [disable it](https://vike.dev/ssr) for all or specific pages.

### HTML Streaming

You can [enable/disable HTML streaming](https://vike.dev/stream) for all or specific pages.`;

  content.addMarkdownFeature(about, "react");

  return content;
}
