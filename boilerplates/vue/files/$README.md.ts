import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const about = `
This app is ready to start thanks to [Vike](https://vike.dev) and [Vue](https://vuejs.org/guide/quick-start.html).
In order to get familiar with [Vike](https://vike.dev), here are some of the features that are already in place:

### [/pages/+config.h.ts](https://vike.dev/config)
This is the interface between Vike and your code. It imports/uses:
- A [Layout](https://vike.dev/Layout) component that wraps your [Pages](https://vike.dev/Page)
- A customizable [Head](https://vike.dev/head) component
- A default [title](https://vike.dev/head)

### [Routing](https://vike.dev/routing)
By default, Vike does [Filesystem Routing](https://vike.dev/filesystem-routing): the URL of a page is determined based on where its +Page.vue (or +config.h.ts) file is located on the filesystem.

If you want to deep dive into routing, Vike lets you choose between:
- [Server Routing and Client Routing](https://vike.dev/server-routing-vs-client-routing)
- [Filesystem Routing](https://vike.dev/filesystem-routing), [Route Strings](https://vike.dev/route-string) and [Route Functions](https://vike.dev/route-function)

### [/pages/_error/+Page.vue](https://vike.dev/error-page)
An error page which is rendered when errors occurs.

### [/pages/+onPageTransitionStart.ts](https://vike.dev/onPageTransitionStart) and [/pages/+onPageTransitionEnd.ts](https://vike.dev/onPageTransitionEnd)
The \`onPageTransitionStart()\` hook, together with \`onPageTransitionEnd()\`, enables you to implement page transition animations.

### [ssr](https://vike.dev/ssr) by default
You can disable SSR for all your pages, or only for some pages while still using SSR for your other pages.

### [HTML Streaming](https://vike.dev/streaming) support
Can be enabled/disabled for all your pages, or only for some pages while still using it for others.
`;

  content.addAbout(about);

  return content.finalize();
}
