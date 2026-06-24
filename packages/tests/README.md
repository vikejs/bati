# tests

- **`*.local.spec.ts`** — plain unit tests, run directly by `bun run test` (Vitest).
- **`e2e/`** — the end-to-end suite: every feature-flag combo is generated into a real app and
  run as a Vitest project. One code path for local and CI, driven by `e2e/runner.ts`. See
  [`e2e/README.md`](./e2e/README.md).
