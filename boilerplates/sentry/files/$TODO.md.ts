import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const about =
    `

## Sentry Browser / Error Tracking & Performance Monitoring

Add your Sentry DSN to \`.env\` file.
You can configure [Sentry for the browser](` +
    (props.meta.BATI.has("react")
      ? "https://docs.sentry.io/platforms/javascript/guides/react/"
      : props.meta.BATI.has("solid")
        ? "https://docs.sentry.io/platforms/javascript/guides/solid/"
        : props.meta.BATI.has("vue")
          ? "https://docs.sentry.io/platforms/javascript/guides/vue/"
          : "https://docs.sentry.io/platforms/javascript/") +
    `) in \`sentry.browser.config.ts\`.

Upload of source maps to Sentry is handled by the [\`sentryVitePlugin\`](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/) in \`vite.config.ts\`.
You have to configure \`SENTRY_ORG\`, \`SENTRY_PROJECT\` and \`SENTRY_AUTH_TOKEN\` in the \`.env.sentry-build-plugin\` file with the values from your Sentry account.

`;

  content.addMarkdownFeature(about, "sentry");

  return content;
}
