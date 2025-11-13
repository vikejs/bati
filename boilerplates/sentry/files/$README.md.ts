import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  //language=Markdown
  const about = `

## Sentry Browser / Error Tracking & Performance Monitoring

This app is integrated with [Sentry](https://sentry.io) for error tracking. 

> [!NOTE]
> Sentry Error Tracking is **only activated in production** (\`import.meta.env.PROD === true\`)!

**Testing Sentry** receiving Errors:
1. Build & Start the app \`${pmCmd} build && ${pmCmd} preview\`.
2. open Testpage in browser: http://localhost:3000/sentry.
3. check your [Sentry Dashboard](https://sentry.io) for new Errors.

`;

  content.addMarkdownFeature(about, "sentry");

  return content;
}
