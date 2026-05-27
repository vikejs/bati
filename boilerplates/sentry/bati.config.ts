import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("sentry");
  },
  env: () => [
    {
      key: "SENTRY_DSN",
      scope: "secret",
      comment: "Sentry DNS. Used for Error Reporting on the Server",
      devValueFrom: "TEST_SENTRY_DSN",
      group: "sentry",
    },
    {
      key: "PUBLIC_ENV__SENTRY_DSN",
      scope: "public",
      comment: "Sentry DNS. Used for Error Reporting in the Browser",
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
});
