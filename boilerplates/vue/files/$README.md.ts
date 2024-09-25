import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const about = `

This app is ready to start. It's powered by [Vike](https://vike.dev) and [Vue](https://vuejs.org/guide/quick-start.html).

### \`/pages/+config.ts\`

Such \`+\` files are [the interface](https://vike.dev/config) between Vike and your code. It defines:
- A default [\`<Layout>\` component](https://vike.dev/Layout) (that wraps your [\`<Page>\` components](https://vike.dev/Page)).
- A default [\`title\`](https://vike.dev/title).
- Global [\`<head>\` tags](https://vike.dev/head-tags).

### Routing

[Vike's built-in router](https://vike.dev/routing) lets you choose between:
 - [Filesystem Routing](https://vike.dev/filesystem-routing) (the URL of a page is determined based on where its \`+Page.vue\` file is located on the filesystem)
 - [Route Strings](https://vike.dev/route-string)
 - [Route Functions](https://vike.dev/route-function)

### \`/pages/_error/+Page.vue\`

The [error page](https://vike.dev/error-page) which is rendered when errors occur.

### \`/pages/+onPageTransitionStart.ts\` and \`/pages/+onPageTransitionEnd.ts\`

The [\`onPageTransitionStart()\` hook](https://vike.dev/onPageTransitionStart), together with [\`onPageTransitionEnd()\`](https://vike.dev/onPageTransitionEnd), enables you to implement page transition animations.

### SSR

SSR is enabled by default. You can [disable it](https://vike.dev/ssr) for all your pages or only for some pages.

### HTML Streaming

You can enable/disable [HTML streaming](https://vike.dev/stream) for all your pages, or only for some pages while still using it for others.`;

  content.addMarkdownFeature(about, "vue");

  return content;
}
