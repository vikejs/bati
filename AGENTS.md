# Copilot Instructions for Bati Repository

## Overview

Bati is a next-generation scaffolding CLI tool for the Vike (Vite-based) ecosystem. It generates fully-functional starter apps by combining boilerplates for different features (React/Vue/Solid, servers, databases, auth, etc.).

**Repository Structure:**
- **TypeScript monorepo** managed with **bun workspaces** and **Nx**
- Node.js ≥22 required, Bun ≥1.3.11 (`packageManager` pins `bun@1.3.11`)
- Workspaces across `/packages/` (10 packages) and `/boilerplates/` (~50 folders, ~42 user-facing features)

## Build Commands (Execute in Order)

**ALWAYS run these commands from the monorepo root:**

```bash
# 1. Install dependencies (required before any build)
bun install

# 2. Build all packages (~55 seconds)
bun run build

# 3. Run unit tests (~15 seconds)
bun run test

# 4. Run type checking (~60 seconds)
bun run check-types

# 5. Run linting (Biome)
bun run lint
```

**Important Notes:**
- `bun run build` must be run after `bun install` and before tests or CLI
- Build uses Nx caching; use `bun run build:force` to rebuild without cache
- The `format` step runs automatically after build via Biome

## Testing

```bash
# Unit tests (fast, ~15s)
bun run test

# E2E tests (extensive, run on CI - not recommended locally due to time)
bun run test:e2e

# Filter E2E tests
bun run test:e2e --filter solid,authjs
```

## Adding E2E Tests for New Features

When adding a new feature, **add E2E tests** to verify it works correctly.

### E2E Test Structure

Tests are in `packages/tests/tests/` with naming convention: `FRAMEWORK+<feature>.spec.ts`

Existing test files and their purposes:
- `FRAMEWORK+ANALYTICS.spec.ts` - Analytics (plausible.io, google-analytics)
- `FRAMEWORK+CSS.spec.ts` - CSS frameworks (tailwindcss, daisyui)
- `FRAMEWORK+SERVER+AUTH.spec.ts` - Server + auth combinations (authjs, auth0)
- `FRAMEWORK+SERVER+DATA.spec.ts` - Server + data fetching (trpc, telefunc, ts-rest, drizzle, sqlite)
- `FRAMEWORK+sentry.spec.ts` - Sentry error tracking
- `FRAMEWORK+prisma.spec.ts` - Prisma ORM
- `FRAMEWORK+cloudflare.spec.ts` - Cloudflare deployment
- `FRAMEWORK+vercel.spec.ts` - Vercel deployment
- `FRAMEWORK+netlify.spec.ts` - Netlify deployment
- `FRAMEWORK+edgeone.spec.ts` - EdgeOne Pages deployment
- `FRAMEWORK+aws.spec.ts` - AWS Lambda deployment
- `FRAMEWORK+prettier.spec.ts` - Prettier formatter
- `FRAMEWORK+storybook.spec.ts` - Storybook
- `react+UI.spec.ts` - React-specific UI libs (compiled-css, mantine)
- `remove-linter-comments.spec.ts` - Linter comment cleanup verification

### Test File Structure

Each test file builds a `suite()` (from `@batijs/tests-utils`, defined in `packages/tests-utils/src/suite.ts`) and exports it as `default`. This **include-only** builder replaced the old `matrix` + `exclude` exports:

```ts
import { describeBati, suite } from "@batijs/tests-utils";

const tests = suite()
  // Cross product of named axes. `null` = "this axis is absent in that combo".
  // `.matrix(...)` can be called multiple times — each call unions in more combos.
  .matrix({
    framework: ["react", "vue"],          // one combo per listed value
    server: "hono",                        // single value = always present
    data: ["trpc", "telefunc", "ts-rest", null],
  })
  .linters("eslint", "biome");             // flags appended to every combo

export default tests;

// Derive the flag union for `testMatch` from the suite's phantom type.
type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeBati(({ test, expect, fetch, testMatch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
  });

  // Conditional tests; `_` is the fallback when no listed flag is present.
  testMatch<TestFlags>("feature-specific test", {
    trpc: async () => { /* test for trpc */ },
    telefunc: async () => { /* test for telefunc */ },
    _: async () => { /* default/fallback test */ },
  });
});
```

Key `suite()` API (see `suite.ts` for the full surface):
- **Axes** are derived from feature categories and stay in sync with `features.ts`: `framework`, `server`, `data`, `db`, `orm`, `deploy`, `css`, `auth`, `analytics`.
- `.matrix({...})` — cross product of named axes; call it repeatedly to add unions of combos (this is how you express "exclusions" — enumerate exactly the combos you want instead of subtracting). `null` replaces the old `undefined` "without" sentinel.
- `.case({...})` — one explicit combo (values can be arrays, e.g. `flags: ["sentry", "logrocket"]`).
- `.linters(...)` — flags added to every combo.
- `spread(axis)` — picks a single value for that axis per combo, **round-robin balanced across the whole repo** so react/vue/solid get roughly equal coverage. Use it when a test is framework-agnostic.
- On load, combos that violate a feature rule (`ERROR_*` in `@batijs/features/rules`) are dropped with a warning, so invalid combinations never reach the CLI.

### Adding Tests - Key Rules

1. **Avoid duplicate combinations**: Check `.github/workflows/tests-entry.yml` to ensure your test combinations don't overlap with existing ones
2. **Enumerate include-only combos**: Express what you want via one or more `.matrix(...)`/`.case(...)` calls rather than subtracting — there is no `exclude` anymore
3. **Add to existing suite when possible**: If your feature fits an existing test category
4. **Create new spec file only if needed**: For truly unique features
5. **Regenerate workflow matrix**: Run `bun run test:e2e workflow-write` to auto-generate entries in `tests-entry.yml` (do NOT edit manually)

### Test Modes

Tests can run in different modes via `describeBati`'s second `options` argument (`mode` may be a constant or a `(context) => Modes` function):
- `mode: "dev"` (default) - Development server
- `mode: "prod"` - Production build + preview
- `mode: "build"` - Build only, no server
- `mode: "docker"` - Build the Docker image and run the container (skipped locally when Docker is unavailable and not on CI)
- `mode: "none"` - No build, no server (file checks only)

### Workflow Entry Generation

After adding a new test file or modifying matrices, regenerate workflow entries:
```bash
bun run test:e2e workflow-write
```
This auto-generates the matrix entries in `.github/workflows/tests-entry.yml`. Never edit this file manually.

## Project Layout

```
/
├── packages/
│   ├── cli/                # Main Bati CLI (@batijs/cli)
│   ├── core/               # Core utilities + codegraft codemods for boilerplate processing
│   ├── compile/            # Boilerplate compilation tools (@batijs/compile)
│   ├── build/              # Build orchestration (@batijs/build)
│   ├── features/           # Feature definitions, categories and compatibility rules
│   ├── batijs/             # The published `batijs` CLI package
│   ├── create-bati/        # `create-vike` entry point (npm create vike)
│   ├── create-batijs-app/  # `@batijs/create-app` entry point (npm create batijs-app)
│   ├── tests/              # E2E test infrastructure
│   └── tests-utils/        # Test utilities (@batijs/tests-utils)
├── boilerplates/      # Feature boilerplates (~50 folders)
│   ├── shared*/       # Base shared boilerplates (shared/-env/-server/-db/-todo); `enforce: "pre"`
│   ├── react/         # React UI framework (also vue/, solid/)
│   ├── hono/          # Hono server (also express/, fastify/, elysia/)
│   └── ...            # Other features (auth, db/orm, hosting, analytics, linters, etc.)
├── website/           # batijs.dev website
├── nx.json            # Nx task definitions and caching
├── biome.json         # Biome linter/formatter config
└── tsconfig.json      # Root TypeScript config
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `nx.json` | Nx task definitions and caching |
| `biome.json` | Linting and formatting rules (extends `@vikejs/biome-config`) |
| `package.json` `workspaces` field | Workspace package locations |
| `packages/features/src/features.ts` | Feature flag definitions |
| `packages/features/src/rules/rules.ts` | Feature compatibility rules |

## Adding/Modifying Boilerplates

**MAINTAINABILITY is the top priority.** Strive for clean code and good separation of concerns.

### When to Create a New Boilerplate

Use `bun run new-boilerplate <name>` when:
- The feature is **UI-framework independent** (e.g., `sentry`, `tailwindcss`, `auth0`)

Create **UI-specific boilerplates** when the feature requires framework-specific code:
- Example: `sentry` feature has: `sentry/` (shared), `react-sentry/`, `vue-sentry/`, `solid-sentry/`
- The UI-specific configs use combined conditions: `meta.BATI.has("react") && meta.BATI.has("sentry")`

### When to Edit Existing Boilerplates (Instead of Creating New Ones)

**Prefer editing existing boilerplates** when creating a new one would add too much complexity or duplication:
- Example: `tailwindcss` doesn't duplicate all components; it uses Bati templating syntax to conditionally add classes in `react/`, `vue/`, `solid/` boilerplates:
  ```tsx
  <div
    // $$.BATI.has("tailwindcss")
    className={"flex max-w-5xl m-auto"}
    // !$$.BATI.has("tailwindcss") && !$$.BATI.has("compiled-css")
    style={{ display: "flex", maxWidth: 900, margin: "auto" }}
  >
  ```

### Boilerplate Setup Steps

1. Create: `bun run new-boilerplate <name>` then `bun install`
2. Configure `boilerplates/<name>/bati.config.ts`:
   ```ts
   export default defineConfig({
     if(meta) {
       return meta.BATI.has("feature-name");
     },
   });
   ```
3. Add files to `boilerplates/<name>/files/`
4. Use `$*.ts` prefix for dynamic files (e.g., `$package.json.ts`)

#### `bati.config.ts` options

`defineConfig` (typed in `packages/core/src/config.ts`) accepts:
- `if(meta, packageManager?)` - include/exclude this boilerplate (omit it for an always-included one like `shared`)
- `enforce: "pre" | "post"` - ordering relative to other boilerplates (`shared`, `shared-env`, `shared-todo` use `"pre"` so later boilerplates can build on their files)
- `env(meta) => EnvVar[]` - **shared env** (#756): declare environment variables this feature contributes, with `key`, `scope`, `default`, `comment`, `group`, and `perSink` overrides (e.g. different `DATABASE_URL` for `compose`/`dockerfile`). Composed centrally via `packages/core/src/env-registry.ts` + `parse/compose-env.ts` into `.env` / `wrangler.jsonc`, so individual boilerplates no longer template env files themselves. See `boilerplates/shared-db/bati.config.ts`.
- `deploy: string[] | (meta) => string[]` - **deploy files** (#757): files (relative to app root) this feature needs in the production runtime; collected by deploy targets such as the Dockerfile generator (`packages/core/src/dockerfile.ts`)
- `nextSteps(meta, pm, colorette) => Step[]` - CLI "next steps" lines printed after scaffolding
- `knip: { entry?, ignoreDependencies?, ignore?, vite? }` - per-boilerplate knip overrides

> The `shared` feature is split into several boilerplates: `shared` (base app shell), `shared-env` (env loading/typing), `shared-server` (`hasServer`), `shared-db` (`hasDbDemo`), and `shared-todo` (the todo demo). Put cross-cutting code in the matching one rather than duplicating it per framework.

### BatiSet Helpers

`bati.config.ts`, `$*.ts` transformers and `hooks/` receive a `BatiSet` instance as `meta.BATI` / `props.meta.BATI`. It is a `Set` subclass defined in `packages/features/src/helpers.ts`, with cross-cutting getters derived from feature categories:
- `BATI.has("feature")` - A given feature flag is enabled
- `BATI.hasServer` - A Server feature (hono/express/fastify/elysia) is selected
- `BATI.hasDatabase` - A Database engine (sqlite/postgres) is selected
- `BATI.hasOrm` - An ORM / query builder (drizzle/kysely/prisma) is selected
- `BATI.hasDbDemo` - A database whose todo demo Bati scaffolds (`hasDatabase` minus prisma, which is self-managed)
- `BATI.hasD1` - Cloudflare D1 (cloudflare + sqlite) is used
- `BATI.hasDotEnvSecrets` - Secrets live in `.env` (true unless cloudflare, which uses `wrangler.jsonc`)
- `BATI.hasUD` - Universal Deploy must be used (any server, or cloudflare/vercel/netlify/docker/dokploy)
- `BATI.pm` - The chosen package manager string (npm/pnpm/yarn/bun)

**Update helpers** when adding features that need cross-cutting detection logic. The `#servers`/`#databases`/`#orm` sets are built from the `Server` / `Database` / `ORM / Query builder` feature categories, so getting a feature's `category` right in `features.ts` is what wires these up.

### Boilerplate File Syntax

For detailed syntax documentation, see [boilerplates/README.md](https://github.com/vikejs/bati/blob/main/boilerplates/README.md).

**Key Concept:** `$$` is the templating namespace available inside scaffolded `files/`. `$$.BATI` is a `Set` containing all chosen features, and `$$.BATI_TEST` is a boolean. The whole `$$.*` surface is resolved away (conditions evaluated, markers removed) when the app is generated.

> **`$$.BATI` vs `meta.BATI`:** `$$.BATI` is templating sugar that only exists inside `files/`. The build-time scripts — `bati.config.ts`, `$*.ts` transformers and `hooks/` — run as real TypeScript and instead receive a `BatiSet` instance as `meta.BATI` / `props.meta.BATI` (see [BatiSet Helpers](#batiset-helpers)). Don't mix the two: `$$.BATI` in a `.config`/`$*.ts` file, or `meta.BATI` inside a templated `files/` file, is a bug.

> **Engine:** transformations run through [codegraft](https://www.npmjs.com/org/codegraft) codemods (`packages/core/src/codemods/`, orchestrated by `packages/core/src/parse/codemods.ts`). This replaced the previous ESLint-based transformers and SquirrellyJS. The per-file pipeline is **collapse → prune → record**: `batiCodemod` resolves `$$` and drops gated imports, `stripLintComments` removes unwanted eslint/biome directives, `removeUnusedImports` prunes, then `batiImports` records the surviving import graph.

#### Special File Names

| Pattern | Description | Priority (low to high) |
|---------|-------------|------------------------|
| `filename` | Standard file | 1 (lowest) |
| `!filename` | Higher priority override file | 2 |
| `$filename.ts` | Dynamic file processed through callback (e.g., `$README.md.ts`) | 3 |
| `!$filename.ts` | Highest priority dynamic file | 4 (highest) |

#### JS/TS/Vue Script Syntax

**If/else statements:**
```ts
if ($$.BATI.has("feature")) {
  console.log("A");
} else {
  console.log("B");
}
// Also works with else-if
```

**Ternary expressions:**
```ts
const myvar = $$.BATI.has("feature") ? "A" : "B";
```

**Comment-based conditional (applies to the next line only):**
```ts
// $$.BATI.has("feature")
import "./mycss";
```

**Include file only if imported:**
```ts
/* $$.keepFileIfImported */
const a = 1;
```

**Type casting helper:**
```ts
// Equivalent to `as any` but dropped entirely when compiled
const a = 'react' as $$.Any;
```

**Conditional types with `$$.If` (first matching condition wins):**
```ts
interface Context {
  ui: $$.If<{
    '$$.BATI.has("react")': "react";
    '$$.BATI.has("vue")': "vue";
    '$$.BATI.has("solid")': "solid";
    _: "other";  // fallback
  }>;
}
```

#### JSX/TSX Syntax

**Conditional attributes (put a `// $$.BATI...` comment before the attribute — note: a single `//`, not `//#`):**
```tsx
<div
  // $$.BATI.has("feature")
  class="p-5"
  // !$$.BATI.has("feature")
  style={{ padding: "20px" }}
>
  {props.children}
</div>
```

#### HTML/JSX/TSX/Vue Template Syntax

**Conditional elements (applies to the next sibling only):**
```html
<!-- $$.BATI.has("feature") -->
<div>
  <span>my text</span>
</div>
<span>my other text</span>
```

#### Universal Syntax (Any File With Comments — CSS, etc.)

Comment-delimited `/* $$.if(cond) */ … /* $$.elif(cond) */ … /* $$.else */ … /* $$.endif */` blocks work in any file that has comments:
```css
/* $$.if($$.BATI.has("feature")) */
@import "./feature.css";
/* $$.endif */
```

#### Important Notes

- **Unsupported JSX pattern:** `{$$.BATI.has("feature") && <div>show me</div>}` is NOT supported
- Unused imports are automatically removed after compilation (so prefer **unconditional imports + conditional usage** over `//`-marked imports). The pruner abstains on any file containing `declare global`, leaving unused imports there — harmless because generated tsconfigs set `skipLibCheck: true`
- Code is automatically formatted with prettier after compilation
- Empty files are not deployed; if an empty file overrides another file, the original is deleted

## CI Validation (GitHub Actions)

**On Pull Requests:**
1. **Checks workflow** (`checks.yml`): Runs on Node 22 & 24
   - `bun install` → `bun run build` → `bun run check-types` → `bun run lint`
   - A `check-tests-matrix` job regenerates `tests-entry.yml` and fails if it is out of date — always commit the result of `bun run test:e2e workflow-write`
2. **Tests workflow** (`tests-entry.yml`): Matrix of E2E tests across OS/features

**To replicate CI locally:**
```bash
bun install && bun run build && bun run check-types && bun run lint && bun run test
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails with missing deps | Run `bun install` first |
| Type errors after changes | Run `bun run build` to regenerate dist files |
| Lint errors | Run `bun run check` to auto-fix (includes format) |
| Stale Nx cache | Use `bun run build:force` |
| Full reset needed | Run `bun run reset` (cleans, reinstalls, rebuilds) |

## Code Style

- **Formatter/Linter**: Biome (not ESLint/Prettier for this repo)
- **Module System**: ES Modules (`"type": "module"`)
- **TypeScript**: Strict mode, NodeNext resolution
- **Line Endings**: LF only (Unix-style)

## Testing CLI Changes

```bash
# Build and run CLI to generate test app
bun run cli  # Creates /tmp/bati-app with default options

# Or manually after build:
node packages/cli/dist/index.js --react --hono /tmp/my-app
```

## Trust These Instructions

These instructions have been validated. Only search the codebase if information appears incorrect or incomplete.
