// The single declaration of which combos exist — the `suite()` builder with
// `.mode()` (primary run mode, default "dev") and `.kind()` (suite identity, which
// drives the kind-scoped assertions and a built/containerized smoke pass).
import { type SuiteKind, type SuiteMode, framework, server, spread, suite } from "@batijs/tests-utils";

export type Mode = SuiteMode;
export type Kind = SuiteKind;

// auth0 only when its credentials are present (CI provides them).
const auths = ["authjs", ...(process.env.TEST_AUTH0_CLIENT_ID ? ["auth0"] : [])];

const matrix = [
  // UI libraries
  suite().matrix({ framework: "react", ui: ["compiled-css", "mantine"] }).linters("eslint", "biome"),
  // CSS
  suite()
    .case({ framework: spread(framework), flags: "tailwindcss" })
    .case({ framework: spread(framework), flags: ["tailwindcss", "daisyui"] })
    .linters("eslint", "biome", "oxlint"),
  // analytics
  suite()
    .matrix({ framework: framework.values, analytics: ["plausible.io", "google-analytics", null] })
    .linters("eslint", "biome", "oxlint"),
  // deploy targets (home only)
  suite().case({ framework: spread(framework), flags: "prettier" }).linters("eslint", "biome", "oxlint"),
  suite().case({ flags: ["vue", "netlify"] }).linters("eslint", "biome", "oxlint"),
  suite().case({ flags: ["react", "edgeone"] }).linters("eslint", "biome", "oxlint"),
  suite()
    .matrix({ framework: "react", deploy: "vercel", server: ["hono", "express", "fastify", "elysia", null] })
    .linters("eslint", "biome", "oxlint"),
  // prisma
  suite()
    .matrix({ framework: spread(framework), server: "hono", flags: "prisma", db: ["sqlite", "postgres"] })
    .linters("eslint", "biome", "oxlint"),
  // sentry
  suite().matrix({ framework: framework.values, flags: "sentry" }).linters("eslint", "biome", "oxlint"),
  // storybook
  suite().case({ framework: spread(framework), flags: "storybook" }).linters("eslint"),
  // agent skills (no server)
  suite()
    .matrix({ framework: framework.values, flags: "claude" })
    .case({ framework: "react", server: "hono", data: "trpc", db: "sqlite", orm: "drizzle", flags: ["codex", "gemini"] })
    .case({ framework: "vue", css: "tailwindcss", deploy: "vercel", analytics: "plausible.io", flags: ["cursor"] })
    .mode("none"),
  // linter-comment stripping (no server)
  suite().matrix({ framework: "react", data: "ts-rest", server: "hono", linter: ["eslint", "biome", "oxlint"] }).mode("none"),
  // aws (cdk synth + Lambda; the assertion owns its setup)
  suite().case({ flags: ["aws", "react", "hono"] }).linters("eslint", "biome", "oxlint").mode("none"),
  // cloudflare — dev + preview + deploy
  suite().matrix({ framework: "react", deploy: "cloudflare", server: ["hono", null] }).linters("eslint", "biome", "oxlint").kind("cloudflare"),
  // server + data — full round-trip in dev, smoke in prod/docker
  suite()
    .matrix({ framework: "solid", server: ["express", "elysia", "hono", "fastify"], data: ["trpc", "telefunc", "ts-rest", null], db: "sqlite", orm: ["drizzle", "kysely", null] })
    .matrix({ framework: "solid", server: ["express", "hono", "fastify", "elysia"], data: ["trpc", "telefunc", "ts-rest", null] })
    .matrix({ framework: ["react", "vue"], server: "hono", data: ["trpc", "telefunc", "ts-rest", null] })
    .matrix({ framework: "solid", server: ["express", "hono"], data: ["telefunc", null], db: "postgres", orm: ["drizzle", "kysely", null] })
    .matrix({ framework: "solid", server: "hono", deploy: "cloudflare", data: ["trpc", "telefunc", "ts-rest", null], db: "sqlite", orm: ["drizzle", "kysely", null] })
    .matrix({ framework: "react", server: "hono", deploy: "dokploy", data: "telefunc", db: ["sqlite", "postgres"], orm: ["drizzle", null] })
    .matrix({ framework: "react", server: "elysia", deploy: "dokploy", data: "telefunc", db: ["sqlite", "postgres"], orm: "drizzle" })
    .linters("eslint", "biome", "oxlint")
    .kind("data"),
  // server + auth — auth flows in dev, smoke in prod/docker
  suite()
    .matrix({ framework: framework.values, server: server.values, auth: auths })
    .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "auth0" })
    .matrix({ framework: "react", server: "hono", deploy: "dokploy", auth: auths })
    .matrix({ framework: framework.values, server: spread(server), auth: "better-auth", db: "sqlite", orm: ["drizzle", "prisma", "kysely", null] })
    .matrix({ framework: "solid", server: spread(server), auth: "better-auth", db: "postgres", orm: ["drizzle", "kysely", null] })
    .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "better-auth", db: "sqlite", orm: ["drizzle", null] })
    .linters("eslint", "biome", "oxlint")
    .kind("auth"),
];

export default matrix;
