# Copilot Instructions for Bati Repository

## Overview

Bati is a next-generation scaffolding CLI tool for the Vike (Vite-based) ecosystem. It generates fully-functional starter apps by combining boilerplates for different features (React/Vue/Solid, servers, databases, auth, etc.).

**Repository Structure:**
- **TypeScript monorepo** managed with **pnpm workspaces** and **Turborepo**
- Node.js ≥20 required, pnpm 10.24.0 (as specified in package.json `packageManager`)
- Workspaces across `/packages/` (~11 packages) and `/boilerplates/` (~42 feature templates)

## Build Commands (Execute in Order)

**ALWAYS run these commands from the monorepo root:**

```bash
# 1. Install dependencies (required before any build)
pnpm install

# 2. Build all packages (~55 seconds)
pnpm run build

# 3. Run unit tests (~15 seconds)
pnpm run test

# 4. Run type checking (~60 seconds)
pnpm run check-types

# 5. Run linting (Biome)
pnpm run lint
```

**Important Notes:**
- `pnpm install` triggers `@batijs/compile` prepublish build automatically
- `pnpm run build` must complete before running tests or CLI
- Build uses Turborepo caching; use `pnpm run build:force` to rebuild without cache
- The `format` step runs automatically after build via Biome

## Testing

```bash
# Unit tests (fast, ~15s)
pnpm run test

# E2E tests (extensive, run on CI - not recommended locally due to time)
pnpm run test:e2e

# Filter E2E tests
pnpm run test:e2e --filter solid,authjs
```

## Project Layout

```
/
├── packages/
│   ├── cli/           # Main Bati CLI (@batijs/cli)
│   ├── core/          # Core utilities for boilerplate processing
│   ├── compile/       # Boilerplate compilation tools
│   ├── build/         # Build orchestration
│   ├── features/      # Feature definitions and rules
│   ├── tests/         # E2E test infrastructure
│   └── tests-utils/   # Test utilities
├── boilerplates/      # Feature boilerplates (~40 folders)
│   ├── shared/        # Base shared boilerplate (processed first via `enforce: "pre"`)
│   ├── react/         # React UI framework
│   ├── vue/           # Vue UI framework
│   ├── solid/         # SolidJS UI framework
│   ├── hono/          # Hono server
│   └── ...            # Other features (auth, db, hosting, etc.)
├── website/           # batijs.dev website
├── turbo.json         # Turborepo configuration
├── biome.json         # Biome linter/formatter config
├── pnpm-workspace.yaml
└── tsconfig.json      # Root TypeScript config
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo task definitions and caching |
| `biome.json` | Linting and formatting rules (extends `@vikejs/biome-config`) |
| `pnpm-workspace.yaml` | Workspace package locations and hoisting config |
| `packages/cli/turbo.json` | CLI-specific build dependencies |
| `packages/features/src/features.ts` | Feature flag definitions |
| `packages/features/src/rules/rules.ts` | Feature compatibility rules |

## Adding/Modifying Boilerplates

1. Create new boilerplate: `pnpm run new-boilerplate <name>`
2. Then run: `pnpm install` to link new package
3. Edit `boilerplates/<name>/bati.config.ts` to configure feature conditions
4. Add files to `boilerplates/<name>/files/`
5. Use `$*.ts` prefix for dynamic files (e.g., `$package.json.ts`)

**Boilerplate Syntax:**
- `BATI.has("feature")` - Check if feature is enabled
- `$filename.ts` files export default functions returning file content
- `!filename` - Higher priority override files

## CI Validation (GitHub Actions)

**On Pull Requests:**
1. **Checks workflow** (`checks.yml`): Runs on Node 20 & 22
   - `pnpm install` → `pnpm run build` → `pnpm run check-types` → `pnpm run lint`
2. **Tests workflow** (`tests-entry.yml`): Matrix of E2E tests across OS/features

**To replicate CI locally:**
```bash
pnpm install && pnpm run build && pnpm run check-types && pnpm run lint && pnpm run test
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails with missing deps | Run `pnpm install` first |
| Type errors after changes | Run `pnpm run build` to regenerate dist files |
| Lint errors | Run `pnpm run check` to auto-fix (includes format) |
| Stale turbo cache | Use `pnpm run build:force` |
| Full reset needed | Run `pnpm run reset` (cleans, reinstalls, rebuilds) |

## Code Style

- **Formatter/Linter**: Biome (not ESLint/Prettier for this repo)
- **Module System**: ES Modules (`"type": "module"`)
- **TypeScript**: Strict mode, NodeNext resolution
- **Line Endings**: LF only (Unix-style)

## Testing CLI Changes

```bash
# Build and run CLI to generate test app
pnpm run cli  # Creates /tmp/bati-app with default options

# Or manually after build:
node packages/cli/dist/index.js --react --hono /tmp/my-app
```

## Trust These Instructions

These instructions have been validated. Only search the codebase if information appears incorrect or incomplete.
