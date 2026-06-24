# Plan: derive the E2E matrix from a boilerplate interaction graph

> ⚠️ **TEMPORARY WORKING DOC — DELETE AT THE END OF IMPLEMENTATION.**
> This file tracks progress and must not survive into the final change. Once every phase is
> done and the final self-review passes, remove it (`git rm MATRIX-GRAPH-PLAN.md`) before the
> change is considered complete.
>
> Update the **Status** checkboxes and the per-step notes as the work advances — this is the
> single source of truth for where the effort stands.

## Status

- [x] **Phase 0** — Validation harness (`matrix-diff` diff test)
- [ ] **Phase 1** — Extraction → `InteractionGraph` (in-memory)
  - [ ] 1a `batiExtract` codemod (`core/codemods/bati-extract.ts`) + `parse/extract.ts`
  - [ ] 1b generator-ref collector (`$`-files)
  - [ ] 1c `resolve.ts` (condition → flags; getter table + sync test)
  - [ ] 1d co-write grouping (reuse `walk`/`toDist`)
  - [ ] 1e `owners.ts` (`if()` probing; assert ≥1 owner)
  - [ ] `buildGraph()` assembles `InteractionGraph`
- [ ] **Phase 2** — Graph CLI (text / JSON / DOT / SVG)
- [ ] **Phase 3** — Matrix generator (`tests-utils/generate-matrix.ts`)
- [ ] **Phase 4** — `verify` semantics (`tests/e2e/verify.ts`, sync-guarded)
- [ ] **Phase 5** — Cutover (`matrix.ts` → `generateMatrix(buildGraph(), verify)`)
- [ ] **Final self-review** (see end of file)
- [ ] **Delete this file**

_Progress log (append dated notes per step):_
- **2026-06-24 · Phase 0 done.** Extracted canonical flatten/dedupe out of `runner.ts` into
  `e2e/combos.ts` (`Combo`, `comboKey`, `buildCombos`) — runner now imports it (no duplicated
  intent). Added `matrix-diff.local.spec.ts`: stub `generateMatrix() → []`, `delta()` reports
  `missing`/`extra`, asserts harness soundness, `test.todo` reserves the Phase-5 cutover gate.
  Baseline measured: **106 current combos** (data 40, auth 31, none 33, cloudflare 2), all unique.
  `check-types` + `vitest run matrix-diff` green.

---

## Engineering constraints (govern every phase)

Acceptance criteria, not aspirations — each phase's review checks them against `git diff`:

- **Day-one cohesion, no patchwork.** New code reads as if it were always there. The extract
  codemod lands *among* the existing codemods (`packages/core/src/codemods/`), in their style.
- **No duplicate intent.** Reuse `walk`/`toDist` (build), `coveringArray`/`Balancer`/`spread`
  (suite), `execRules` (features), `extractDirective`/`usesNamespace`/`bati-blocks` markers
  (codemods). One getter→flags table, one place.
- **No defensive/compat branches for unreachable paths.** Assert the invariant instead. Owner
  resolution *asserts* every gated boilerplate resolves to ≥1 owner — no silent "no owner" branch.
- **Caller above callee, top-to-bottom.** Each file opens with its entry point; helpers follow in
  call order.
- **Every line earns its place.** No speculative options, unused params, or "might need later."
- **Self-documenting via naming; comment only what code can't say.** No walls-of-text JSDoc
  restating the signature. Match surrounding comment density, don't exceed it.
- **Guard against regressions.** Each phase ends with `git diff` review + the Phase-0 diff test green.

---

## Conceptual model — the destination file is the unit of interaction

Two features **interact** iff they jointly determine the content of some generated output file, in
exactly two ways, both keyed on the `toDist` destination:

- **Co-write**: two boilerplates contribute to the same destination (the rearranger merges them).
- **Conditional**: a boilerplate's template/generator for a destination branches on another
  feature's flag.

Per destination, the meeting flag-set = `owners(contributors) ∪ referenced(conditionals)`; every
pair within it is an edge. Union across all destinations = the interaction graph. Connected
components = clusters to cover.

## Architecture / data flow

```
boilerplates/*/{files,bati.config.ts}
   │
   ▼  @batijs/graft-graph · buildGraph()   (in-memory, runs once over ALL boilerplates)
InteractionGraph  ──┬─→  tests-utils matrix generator  → combos + "why" trace → e2e runner   [data path]
                    └─→  graft-graph CLI → text | JSON | DOT | SVG                            [human path, gitignored]
```

The data path is **in-process** (`buildGraph()` at runner startup) — nothing committed, nothing to
drift. The CLI renderings are a separate, on-demand human path.

## Package split (the architectural pinnacle)

Extraction primitives stay in **core** (cohesive with the existing codemod family); graph assembly,
rendering, and the CLI shell are the new package. Pure core (no I/O) is separated from the I/O shell.

```
packages/core/src/
  codemods/bati-extract.ts   # NEW codemod: harvest $$ condition strings (sibling of bati-codemod)
  parse/extract.ts           # NEW entry: extractReferences(code, filepath) — mirrors parse/codemods.ts

packages/graft-graph/src/
  index.ts        # buildGraph(): InteractionGraph — orchestration; callees below it
  owners.ts       # boilerplate → activating flag(s), via bati.config if() probing
  resolve.ts      # condition string → Set<flag>; getter table mirrors features/helpers.ts
  render.ts       # InteractionGraph → { text, json, dot, svg }  (pure transforms)
  cli.ts          # bin shell: parse args, buildGraph(), pick renderer, write   (the only I/O)
```

- **Pure core** = `buildGraph`, `owners`, `resolve`, `render` (data→data). **Shell** = `cli` only.
- `render.ts` builds DOT (pure string); SVG via **`@viz-js/viz`** (WASM graphviz — no system binary,
  consistent with the repo's WASM-grammar approach).

---

## Phase 0 — Validation harness first (no behavior change)

`packages/tests/matrix-diff.local.spec.ts`: flatten current `matrix.ts` (via `Suite.flatten` + fresh
`Balancer`) into a canonical combo set; diff against the generator (stubbed `[]` at first). The two
deltas are the spec for done-ness:
- **generated − current** = new coverage or over-generation.
- **current − generated** = missed intent → a missing edge (fix extraction) or genuine semantics →
  encode in `verify`.

Stays as the permanent cutover gate. **Acceptance:** prints both deltas; `git diff` clean elsewhere.

## Phase 1 — Extraction → `InteractionGraph` (in-memory)

New `@batijs/graft-graph` (deps `@batijs/core`, `@batijs/build`, `@batijs/features`). Units, in call order:

**1a. `batiExtract` codemod** — `core/src/codemods/bati-extract.ts` (+ `index.ts` export).
`defineCodemod({ namespace: "$$" })`, same walk shape as `batiCodemod` but harvests condition
strings instead of evaluating/pruning: leading-comment directives (`extractDirective`),
`if`/ternary where `usesNamespace`, `$$.if/elif` markers (reuse `bati-blocks` `MARKER`/`toMarker`),
`$$.If<>`/`keepFileIf`/`keepCommentsIf` keys. Returns `Set<string>`. `parse/extract.ts` exposes
`extractReferences(code, filepath)` over `extToTarget` — symmetric to `runCodemods`.
Grammar-accurate (vue zones, css/html, ternaries, conditional types), so no regex.

**1b. Generator-ref collector** — for `$`-files (real JS): AST-collect `*.BATI.has("literal")` args
and `*.BATI.<hasX>` member reads. Branch-complete (symbolic, no execution); folds into
`extractReferences` for `$`-named files.

**1c. `resolve.ts`** — condition string → flags: `has("x")→x`; derived getters → flag-sets from a
table mirroring `features/helpers.ts` (`hasServer→Server`, `hasD1→{cloudflare,sqlite}`,
`hasDatabase→Database`, …). Unit test asserts every getter in `helpers.ts` is mapped (new getter ⇒
test fails). One table, no duplication.

**1d. Co-write grouping** — reuse build's `walk`+`toDist` (lift to exported helpers) over
`boilerplates/*/files`, group by destination; >1 contributor ⇒ co-write candidates.

**1e. `owners.ts`** — boilerplate → activating flag(s) by probing `bati.config.ts` `if(meta)` with
single-flag then pairwise probe metas from `features.ts`. `shared-*` (no `if`) = "base." **Assert**
every gated boilerplate resolves to ≥1 owner.

`buildGraph()` assembles `InteractionGraph { flags[], edges[], perFile }` (provenance for the "why"
trace). **Acceptance:** every `features.ts` flag present; known pairs hold
(drizzle↔postgres/sqlite/server/cloudflare, sentry↔framework, mantine↔react); `git diff` review.

## Phase 2 — Graph CLI (text / JSON / DOT / SVG)

`render.ts` (pure) + `cli.ts` (shell). `bati-graph` bin:
- `--format text|json|dot|svg` (default `text`), `--out <file>` (stdout for text/json/dot; file for svg).
- `text` = readable adjacency for terminal use; `svg` via `@viz-js/viz`.
- Output paths gitignored. **Acceptance:** `bati-graph --format svg --out graph.svg` renders;
  `--format text` matches the in-memory graph; CLI is the only file touching I/O.

## Phase 3 — Matrix generator

`packages/tests-utils/src/generate-matrix.ts`, consuming `buildGraph()` + `verify` (Phase 4):
1. Cluster the graph (connected components).
2. Per cluster: t=2 covering array via existing `coveringArray`; non-interacting categories ride
   along balanced (existing `spread`/`Balancer`); per-cluster `strength` override (default 2).
3. Validity filter via `execRules`.
4. Stamp `mode`/`kind`/`linters`/env from `verify`.
5. Emit `string[][]` + per-combo "why" trace from `perFile`.

**Acceptance:** Phase-0 delta shrinks to an explainable residue.

## Phase 4 — `verify` semantics (test package, not user-facing)

Not on the `Feature` type (that's the public catalog). A test-owned module keyed by flag/category,
co-located with the generator — `packages/tests/e2e/verify.ts` (adjacent to `matrix.ts`):

```ts
export const verify: Record<string, {
  kind?: "data" | "auth" | "cloudflare";
  mode?: SuiteMode;
  smoke?: SuiteMode[];
  strength?: 2 | 3;
  requiresEnv?: string[];
}>;
export const coTests: Record<string, CategoryLabels | string[]>;  // explicit edge override / escape hatch
```

A sync-guard test asserts every key is a real flag/category in `features.ts` (catches drift without
coupling the public type). Port the `matrix.ts` cases Phase 0 flags as intentional-but-underivable
(auth dev round-trip + prod/docker smoke; auth0 `requiresEnv`).

## Phase 5 — Cutover

`matrix.ts` → `generateMatrix(buildGraph(), verify)` + a short explicit residue. No committed
artifact, no drift check (graph is fresh each run). Phase-0 diff test becomes the permanent guard
(delta empty/whitelisted). Update `e2e/README.md`: a new feature auto-extends the matrix; touch
`verify`/`coTests` only for what can't be inferred. Final `git diff` review across all packages.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Static scan misses dynamic refs | Symbolic extraction is branch-complete; `coTests` escape hatch |
| Over-generation | Pairwise + clustering + `strength`; assert a combo budget in the diff test |
| 3-way bugs pairs miss | `strength: 3` opt-in per cluster |
| Owner resolution gaps | Pairwise probing + **assertion** every gated boilerplate has an owner |
| SVG toolchain weight | `@viz-js/viz` (WASM, no native dep), isolated in `render.ts` |
| Lost narrative | Per-combo "why" trace from `perFile` provenance |

## Open decisions (resolved)

1. Graph artifact → **in-memory, not committed**; CLI renders gitignored.
2. `verify` home → **`packages/tests/e2e/verify.ts`**, keyed by flag, sync-guarded; off the public
   `Feature` type.
3. New package → **`@batijs/graft-graph`**.

---

## Final self-review (run before deleting this file)

Before removing this plan, review the complete change against each principle and tick it off:

- [ ] **Pinnacle architectural split** — pure core (`buildGraph`/`owners`/`resolve`/`render`)
  cleanly separated from the I/O shell (`cli`); extraction primitives in `core`, assembly/render in
  `graft-graph`; no responsibility bleed.
- [ ] **No patchwork** — the code is cohesive, as if it were there from day one; new files match the
  idiom of their neighbours.
- [ ] **No useless branching** — no theoretical "defensive"/"compat" branches for unreachable paths;
  invariants are enforced with assertions, not branches.
- [ ] **No duplicate intent** — shared logic exists once (`walk`/`toDist`, `coveringArray`/
  `Balancer`, `execRules`, the getter→flags table).
- [ ] **Reads top to bottom, caller above callee** — every file.
- [ ] **Every line earns its place** — no dead code, unused params, or speculative options.
- [ ] **Check `git diff` for regressions** — nothing unrelated changed; Phase-0 diff test green.
- [ ] **No walls-of-text JSDoc** — self-documenting through naming; comments only where the code
  can't explain itself.

Once all boxes above are ticked: **delete this file** and drop it from the change.
