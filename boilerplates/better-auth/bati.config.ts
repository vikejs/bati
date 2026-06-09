import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("better-auth");
  },
  env: () => [
    {
      key: "BETTER_AUTH_SECRET",
      scope: "server-default",
      default: "dev-secret-please-change-me-in-production",
      comment:
        "Better Auth secret used to sign cookies and tokens — replace in production. See https://better-auth.com/docs/reference/options#secret",
    },
    {
      key: "GITHUB_CLIENT_ID",
      scope: "secret",
      comment: "GitHub OAuth Client ID",
      devValueFrom: "TEST_GITHUB_CLIENT_ID",
      group: "github",
    },
    {
      key: "GITHUB_CLIENT_SECRET",
      scope: "secret",
      comment: "GitHub OAuth Client Secret",
      devValueFrom: "TEST_GITHUB_CLIENT_SECRET",
      group: "github",
    },
  ],
  nextSteps(meta, packageManager, { bold }) {
    return [
      ...(meta.BATI.hasD1
        ? []
        : [
            {
              type: "command" as const,
              step: `${packageManager} better-auth:migrate`,
            },
          ]),
      {
        type: "text" as const,
        step: `Configure Better Auth (secret, GitHub OAuth, migrations). Check ${bold("TODO.md")} for details`,
      },
    ];
  },
  knip: {
    entry: ["server/better-auth-handler.ts", "database/better-auth/migrate.ts"],
  },
});
