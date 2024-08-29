import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const about =
    `

This app is ready to start. It's powered by [Vike](https://vike.dev) and [React](https://react.dev/learn).

### \`/pages/+config.ts\`

Such \`+\` files are [the interface](https://vike.dev/config) between Vike and your code. It defines:
- A default [\`<Layout>\` component](https://vike.dev/Layout) (that wraps your [\`<Page>\` components](https://vike.dev/Page)).
- A default [\`title\`](https://vike.dev/title).
- Global [\`<head>\` tags](https://vike.dev/head-tags).

### Routing

[Vike's built-in router](https://vike.dev/routing) lets you choose between:
 - [Filesystem Routing](https://vike.dev/filesystem-routing) (the URL of a page is determined based on where its \`+Page.jsx\` file is located on the filesystem)
 - [Route Strings](https://vike.dev/route-string)
 - [Route Functions](https://vike.dev/route-function)

### \`/pages/_error/+Page.jsx\`

The [error page](https://vike.dev/error-page) which is rendered when errors occur.

### \`/pages/+onPageTransitionStart.ts\` and \`/pages/+onPageTransitionEnd.ts\`

The [\`onPageTransitionStart()\` hook](https://vike.dev/onPageTransitionStart), together with [\`onPageTransitionEnd()\`](https://vike.dev/onPageTransitionEnd), enables you to implement page transition animations.

### SSR

SSR is enabled by default. You can [disable it](https://vike.dev/ssr) for all your pages or only for some pages.

### HTML Streaming

You can enable/disable [HTML streaming](https://vike.dev/streaming) for all your pages, or only for some pages while still using it for others.` +
    (props.meta.BATI.has("sentry")
      ? `

## Sentry Browser

This app is integrated with [Sentry](https://sentry.io) for error tracking. 

Add your Sentry DSN and other Sentry API keys and secrets to \`.env\` file.
You can configure [Sentry for the browser](https://docs.sentry.io/platforms/javascript/guides/react/) in \`sentry.browser.config.ts\` - sentry is only activated when build for production \`production\`.
Upload of source maps to Sentry is handled by the [\`sentryVitePlugin\`](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/) in \`vite.config.ts\`.

**Testing Sentry** receiving Errors:
http://localhost:3000/sentry

`
      : "");

  content.addAbout(about);

  return content.finalize();
}
