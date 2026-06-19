import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("sentry");
  },
  env: () => [
    {
      key: "SENTRY_DSN",
      scope: "secret",
      comment: "Sentry DSN. Used for Error Reporting on the Server",
      devValueFrom: "TEST_SENTRY_DSN",
      group: "sentry",
    },
    {
      key: "PUBLIC_ENV__SENTRY_DSN",
      scope: "public",
      comment: "Sentry DSN. Used for Error Reporting in the Browser",
      default: "",
    },
  ],
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Add your Sentry DSN to the .env file. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
  // Error-tracking skill (SKILLS_PLAN.md §6.M) — framework-aware SDK.
  skills(meta) {
    const sdk = meta.BATI.has("vue") ? "@sentry/vue" : meta.BATI.has("solid") ? "@sentry/solid" : "@sentry/react";
    return [
      {
        name: "sentry",
        description: "How error tracking works in this app (Sentry). Use when capturing errors or configuring Sentry.",
        body: `Sentry error tracking. Browser init is in \`sentry.browser.config.ts\` (using \`${sdk}\`); the \`sentryVitePlugin\` (source maps) is in \`vite.config.ts\`.

- **Configure:** set \`SENTRY_DSN\` + \`PUBLIC_ENV__SENTRY_DSN\` in \`.env\`, and the org/project in \`.env.sentry-build-plugin\`.
- **Capture errors:** \`import * as Sentry from "${sdk}"\` and call \`Sentry.captureException(err)\`; uncaught errors are reported automatically.

See https://docs.sentry.io.`,
      },
    ];
  },
});
