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
      // With Drizzle or Cloudflare D1, Better Auth's tables are created by Drizzle's migrate flow or a
      // wrangler D1 migration; only the standalone engines get a dedicated `better-auth:migrate` step.
      ...(meta.BATI.hasD1 || meta.BATI.has("drizzle")
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
  // Auth skill (SKILLS_PLAN.md §6.J).
  skills(meta) {
    const run = meta.BATI.pmRun;
    const tablesNote = meta.BATI.has("drizzle")
      ? "they're created by Drizzle's migrate flow"
      : meta.BATI.hasD1
        ? "they're applied via a wrangler D1 migration"
        : `run \`${run} better-auth:migrate\` to create them`;
    return [
      {
        name: "auth",
        description:
          "How authentication works in this app (Better Auth). Use when reading the signed-in user, protecting a route, or configuring providers.",
        body: `Better Auth. Server config + providers live in \`server/better-auth.ts\`; the route and session middleware are in \`server/better-auth-handler.ts\` (the middleware populates \`pageContext.user\`). Login/signup/account pages and the \`AuthNav\` component are framework-specific (under \`pages/\` and \`components/\`).

- **Read the user:** \`pageContext.user\` (on the server and during client-side navigation).
- **Protect a route:** add a \`+guard.ts\` beside the page — \`if (!pageContext.user) throw redirect("/login")\` (see \`pages/account/+guard.ts\`).
- **Add a provider:** configure it in \`server/better-auth.ts\`; OAuth credentials go in \`.env\`.
- **Tables:** Better Auth owns its user/session tables — ${tablesNote}.

See https://better-auth.com/docs.`,
      },
    ];
  },
});
