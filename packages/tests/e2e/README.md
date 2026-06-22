# E2E tests

Each combo of feature flags is generated into a real app and run as a Vitest
project, via the programmatic Vitest API. One code path for local and CI.

## Run

```bash
bun run build                                   # build the CLI + tests-utils first
bun packages/tests/e2e/runner.ts                # the whole matrix
bun packages/tests/e2e/runner.ts --only react,mantine,eslint,biome   # one combo (a CI job)
```

## Layout

| File | Responsibility |
|---|---|
| `matrix.ts` | the single declaration of which combos exist — an array of `suite()` builders |
| `runner.ts` | matrix → generate an app per combo → run them all as Vitest projects |
| `fixtures.ts` | boot/teardown the app in a mode, the `fetch` test, shared helpers |
| `e2e.spec.ts` | every assertion, shared by all projects |

A combo runs in up to three passes (`e2e.spec.ts`): a **primary** pass (boot in
its `mode`, run every assertion — each self-gates on flags), an optional **smoke**
pass (re-run `/` once built/containerized — `.kind(...)` combos), and **checks**
(lint / typecheck / knip). The smoke pass's mode derives from flags (dokploy→docker,
cloudflare→preview, else prod).

## Adding coverage

- A new flag combination → an entry in `matrix.ts`.
- A new assertion → a function in `e2e.spec.ts` + a call in the composition; gate
  it with `test.runIf(BATI.has(...))`.
