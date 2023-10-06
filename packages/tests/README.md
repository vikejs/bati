This repo doesn't run tests directly unless they are `*.local.spec.ts` files.
All other tests in `tests` folder follow these steps:
- Create temp folder for a monorepo basis (usually _/tmp/bati_)
- Call Bati CLI for all combinations defined by tests `matrix` exports in _<temp folder>/packages/_
- Copy necessary tests to the right _<temp folder>/packages/<repo hash>_ folder
- Update package.json of those repos
- Create a vitest config in each of those repos
- Create package.json amd Turborepo config in workspace root
- Call _pnpm/bun install_ in monorepo
- Call `turborepo run test lint build` in monorepo
- Handles Turborepo cache via _/tmp/bati-cache_ folder
