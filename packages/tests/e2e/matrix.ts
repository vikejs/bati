// The single declaration of which (flags, mode) combos exist — the same `suite()`
// builder as the old per-spec files, now decoupled from the test bodies. The runner
// flattens every entry into a Vitest project; fragments self-gate on flags.
import { type Suite, framework, server, spread, suite } from "@batijs/tests-utils";

export type Mode = "dev" | "prod" | "preview" | "docker" | "none";

export interface MatrixEntry {
  suite: Suite;
  mode?: Mode; // primary pass; default "dev"
  smoke?: boolean; // also re-run "/" in the built/containerized mode after the primary pass
}

// auth0 only when its credentials are present (CI provides them).
const auths = ["authjs", ...(process.env.TEST_AUTH0_CLIENT_ID ? ["auth0"] : [])];

const matrix: MatrixEntry[] = [
  // UI libraries
  { suite: suite().matrix({ framework: "react", ui: ["compiled-css", "mantine"] }).linters("eslint", "biome") },
  // CSS
  {
    suite: suite()
      .case({ framework: spread(framework), flags: "tailwindcss" })
      .case({ framework: spread(framework), flags: ["tailwindcss", "daisyui"] })
      .linters("eslint", "biome", "oxlint"),
  },
  // analytics
  {
    suite: suite()
      .matrix({ framework: framework.values, analytics: ["plausible.io", "google-analytics", null] })
      .linters("eslint", "biome", "oxlint"),
  },
  // deploy targets (home only)
  { suite: suite().case({ framework: spread(framework), flags: "prettier" }).linters("eslint", "biome", "oxlint") },
  { suite: suite().case({ flags: ["vue", "netlify"] }).linters("eslint", "biome", "oxlint") },
  { suite: suite().case({ flags: ["react", "edgeone"] }).linters("eslint", "biome", "oxlint") },
  {
    suite: suite()
      .matrix({ framework: "react", deploy: "vercel", server: ["hono", "express", "fastify", "elysia", null] })
      .linters("eslint", "biome", "oxlint"),
  },
  // prisma
  {
    suite: suite()
      .matrix({ framework: spread(framework), server: "hono", flags: "prisma", db: ["sqlite", "postgres"] })
      .linters("eslint", "biome", "oxlint"),
  },
  // sentry
  { suite: suite().matrix({ framework: framework.values, flags: "sentry" }).linters("eslint", "biome", "oxlint") },
  // storybook
  { suite: suite().case({ framework: spread(framework), flags: "storybook" }).linters("eslint") },
  // agent skills (no server)
  {
    suite: suite()
      .matrix({ framework: framework.values, flags: "claude" })
      .case({ framework: "react", server: "hono", data: "trpc", db: "sqlite", orm: "drizzle", flags: ["codex", "gemini"] })
      .case({ framework: "vue", css: "tailwindcss", deploy: "vercel", analytics: "plausible.io", flags: ["cursor"] }),
    mode: "none",
  },
  // linter-comment stripping (no server)
  {
    suite: suite().matrix({ framework: "react", data: "ts-rest", server: "hono", linter: ["eslint", "biome", "oxlint"] }),
    mode: "none",
  },
  // aws (cdk synth + Lambda; the fragment owns its setup)
  { suite: suite().case({ flags: ["aws", "react", "hono"] }).linters("eslint", "biome", "oxlint"), mode: "none" },
  // cloudflare — dev + preview + deploy
  {
    suite: suite()
      .matrix({ framework: "react", deploy: "cloudflare", server: ["hono", null] })
      .linters("eslint", "biome", "oxlint"),
    smoke: true,
  },
  // server + data — full data round-trip in dev, smoke in prod/docker
  {
    suite: suite()
      .matrix({ framework: "solid", server: ["express", "elysia", "hono", "fastify"], data: ["trpc", "telefunc", "ts-rest", null], db: "sqlite", orm: ["drizzle", "kysely", null] })
      .matrix({ framework: "solid", server: ["express", "hono", "fastify", "elysia"], data: ["trpc", "telefunc", "ts-rest", null] })
      .matrix({ framework: ["react", "vue"], server: "hono", data: ["trpc", "telefunc", "ts-rest", null] })
      .matrix({ framework: "solid", server: ["express", "hono"], data: ["telefunc", null], db: "postgres", orm: ["drizzle", "kysely", null] })
      .matrix({ framework: "solid", server: "hono", deploy: "cloudflare", data: ["trpc", "telefunc", "ts-rest", null], db: "sqlite", orm: ["drizzle", "kysely", null] })
      .matrix({ framework: "react", server: "hono", deploy: "dokploy", data: "telefunc", db: ["sqlite", "postgres"], orm: ["drizzle", null] })
      .matrix({ framework: "react", server: "elysia", deploy: "dokploy", data: "telefunc", db: ["sqlite", "postgres"], orm: "drizzle" })
      .linters("eslint", "biome", "oxlint"),
    smoke: true,
  },
  // server + auth — auth flows in dev, smoke in prod/docker
  {
    suite: suite()
      .matrix({ framework: framework.values, server: server.values, auth: auths })
      .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "auth0" })
      .matrix({ framework: "react", server: "hono", deploy: "dokploy", auth: auths })
      .matrix({ framework: framework.values, server: spread(server), auth: "better-auth", db: "sqlite", orm: ["drizzle", "prisma", "kysely", null] })
      .matrix({ framework: "solid", server: spread(server), auth: "better-auth", db: "postgres", orm: ["drizzle", "kysely", null] })
      .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "better-auth", db: "sqlite", orm: ["drizzle", null] })
      .linters("eslint", "biome", "oxlint"),
    smoke: true,
  },
];

export default matrix;
