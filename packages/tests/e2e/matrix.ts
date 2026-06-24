// The combos the E2E suite runs. The backend core (server / data / db / orm / auth on the home
// deploy) is generated from the boilerplate interaction graph — see `generate.ts`. The `residue`
// below is everything the generator doesn't produce: the peripheral feature suites, and the
// deploy-specific backend variants (Cloudflare D1, dokploy) that ride on a non-home runtime.
import { Balancer, framework, type SuiteKind, type SuiteMode, spread, suite } from "@batijs/tests-utils";
import { type Combo, comboKey } from "./combos.js";
import { generateMatrix } from "./generate.js";

export type Mode = SuiteMode;
export type Kind = SuiteKind;

// auth0 only when its credentials are present (CI provides them).
const auths = ["authjs", ...(process.env.TEST_AUTH0_CLIENT_ID ? ["auth0"] : [])];

const residue = [
  // UI libraries (shadcn-ui dependsOn tailwindcss + react, resolved by the CLI)
  suite()
    .matrix({ framework: "react", ui: ["compiled-css", "mantine", "shadcn-ui"] })
    .linters("eslint", "biome"),
  // CSS
  suite()
    .case({ framework: spread(framework), flags: "tailwindcss" })
    .case({ framework: spread(framework), flags: ["tailwindcss", "daisyui"] })
    .linters("eslint", "biome", "oxlint"),
  // analytics
  suite()
    .matrix({ framework: framework.values, analytics: ["plausible.io", "google-analytics", null] })
    .linters("eslint", "biome", "oxlint"),
  // deploy targets (home + serverless)
  suite()
    .case({ framework: spread(framework), flags: "prettier" })
    .linters("eslint", "biome", "oxlint"),
  suite()
    .case({ flags: ["vue", "netlify"] })
    .linters("eslint", "biome", "oxlint"),
  suite()
    .case({ flags: ["react", "edgeone"] })
    .linters("eslint", "biome", "oxlint"),
  suite()
    .matrix({ framework: spread(framework), deploy: "vercel", server: ["hono", "express", "fastify", "elysia", null] })
    .linters("eslint", "biome", "oxlint"),
  // prisma — build-check only; prisma opts out of the shared data demo
  suite()
    .matrix({ framework: spread(framework), server: "hono", flags: "prisma", db: ["sqlite", "postgres"] })
    .linters("eslint", "biome", "oxlint"),
  // sentry
  suite().matrix({ framework: framework.values, flags: "sentry" }).linters("eslint", "biome", "oxlint"),
  // storybook
  suite()
    .case({ framework: spread(framework), flags: "storybook" })
    .linters("eslint"),
  // agent skills — cover the feature-gated branches cheaply (no server)
  suite()
    .case({ framework: "react", server: "hono", data: "trpc", db: "sqlite", orm: "drizzle" })
    .case({ framework: "vue", css: "tailwindcss", deploy: "vercel", analytics: "plausible.io" })
    .mode("none"),
  // linter-comment stripping (no server)
  suite()
    .matrix({ framework: spread(framework), data: "ts-rest", server: "hono", linter: ["eslint", "biome", "oxlint"] })
    .mode("none"),
  // aws (cdk synth + Lambda; the assertion owns its setup)
  suite()
    .case({ flags: ["aws", "react", "hono"] })
    .linters("eslint", "biome", "oxlint")
    .mode("none"),
  // cloudflare — dev + preview + deploy
  suite()
    .matrix({ framework: "react", deploy: "cloudflare", server: ["hono", null] })
    .linters("eslint", "biome", "oxlint")
    .kind("cloudflare"),
  // data — Cloudflare D1 (worker runtime) + dokploy (container smoke); the home-deploy core is generated
  suite()
    .pairwise({
      framework: framework.values,
      server: "hono",
      deploy: "cloudflare",
      data: ["trpc", "telefunc", "ts-rest", null],
      db: "sqlite",
      orm: ["drizzle", "kysely", null],
    })
    .matrix({
      framework: spread(framework),
      server: "hono",
      deploy: "dokploy",
      data: "telefunc",
      db: ["sqlite", "postgres"],
      orm: ["drizzle", null],
    })
    .matrix({
      framework: spread(framework),
      server: "elysia",
      deploy: "dokploy",
      data: "telefunc",
      db: ["sqlite", "postgres"],
      orm: "drizzle",
    })
    .linters("eslint", "biome", "oxlint")
    .kind("data"),
  // auth — Cloudflare + dokploy variants; the home-deploy core is generated
  suite()
    .matrix({ framework: "react", server: "hono", deploy: "cloudflare", auth: "auth0" })
    .matrix({ framework: "react", server: "hono", deploy: "dokploy", auth: auths })
    .matrix({
      framework: "react",
      server: "hono",
      deploy: "cloudflare",
      auth: "better-auth",
      db: "sqlite",
      orm: ["drizzle", null],
    })
    .linters("eslint", "biome", "oxlint")
    .kind("auth"),
];

export default buildMatrix(await generateMatrix());

// Generated backend core first, then the residue suites, deduped — the generator and a hand suite can
// land on the same combo.
function buildMatrix(generated: Combo[]): Combo[] {
  const balancer = new Balancer();
  const seen = new Set<string>();
  const combos: Combo[] = [];
  const add = (combo: Combo) => {
    const key = comboKey(combo);
    if (seen.has(key)) return;
    seen.add(key);
    combos.push(combo);
  };

  for (const combo of generated) add(combo);
  for (const s of residue)
    for (const flags of s.flatten(balancer)) add({ flags, mode: s.runMode ?? "dev", kind: s.suiteKind });
  return combos;
}
