# Bati AI-agent skills — Feature Plan

> **Status:** Draft / living document. Enumerates **all candidate skills** Bati could generate, plus the
> decisions taken so far (per-agent feature flags, instruction files, granularity). Architecture, naming,
> and final scope still to fill in. Location is provisional — move under `doc/` if preferred.

## 1. Goal (placeholder — expand later)

Generate agent **Skills** (and agent **instruction files**, §3) into the scaffolded app, tailored to
**exactly** the feature set the user selected. The audience is a coding agent working in the generated
repo; the content is stack-correct, version-correct procedural knowledge.

**No dedicated `--skills` flag.** Each target AI agent is its own feature flag in a **new `features.ts`
category** (§4): `--claude`, `--codex`, `--gemini`, `--cursor`, `--copilot`. Selecting one or more both
opts into generation and picks the destination path(s) — so a separate `--skills` flag is redundant.

Same compositional model as Bati's existing `$README.md.ts` / `nextSteps()` / `deploy` / `env()`: each
boilerplate declares the fragment(s) it contributes; a central composer writes the selected ones into
each selected agent's directory.

## 2. What a generated skill is (recap)

A folder with `SKILL.md` (YAML frontmatter `name` + `description`, then a Markdown body) and optional
bundled reference docs / runnable scripts. `description` is the auto-trigger (states *what* + *when*).
Progressive disclosure: name+description always in context → body on trigger → bundled files on demand.

## 3. Skills vs. agent instruction files (`.md`) — both are in scope

**Yes, `AGENTS.md` / `CLAUDE.md` / etc. are relevant — they are the complementary half of skills.** There
are two delivery mechanisms for agent-facing knowledge, and Bati should generate both:

| | **Skills** (`<agent>/skills/<name>/SKILL.md`) | **Instruction files** (root / agent `.md`) |
|---|---|---|
| Loading | On-demand, progressively disclosed; loaded only when the `description` matches the task | Always loaded, every session |
| Best for | Deep, situational *how-tos* (add an RPC, write a migration) | Project-wide *orientation & conventions* (layout, scripts, dos/don'ts) |
| Risk if misused | Agent may never trigger it for must-know facts | Bloats every request — the problem skills exist to solve |

They are complementary, not competing. **Recommendation:** route the always-on "core" content
(`project-overview`, `dev-workflow`, `env-and-secrets`) into the **instruction file**, and keep the
Vike-core + per-feature items as **skills**. This refines catalog group A (§6).

Per-agent instruction-file paths (**verified 2026-06-16, see §15**):

| Flag | Agent | Instruction file | AGENTS.md native? | `@` import? |
|---|---|---|---|---|
| `claude` | Claude Code | `CLAUDE.md` = `@AGENTS.md` shim | no (CLAUDE.md only) | yes (depth 4) |
| `codex` | OpenAI Codex | `AGENTS.md` (native) | yes | no |
| `gemini` | Gemini CLI | `GEMINI.md` = `@./AGENTS.md` shim | via config only | yes (depth 5) |
| `cursor` | Cursor | `AGENTS.md` (native); also `.cursor/rules/*.mdc` | yes | n/a (attach, not import) |
| `copilot` | GitHub Copilot | `AGENTS.md` (native); also `.github/copilot-instructions.md` | yes | no |

Notes:
- `AGENTS.md` is the cross-agent standard — native for **Codex, Cursor, Copilot** (§15). Make it the
  **canonical** instruction file. The only two agents that don't read it natively — **Claude** and
  **Gemini** — both support an `@path` import, so ship a one-line **`@AGENTS.md` shim** as `CLAUDE.md` /
  `GEMINI.md` (a plain one-line file is git / zip / Windows-safe; no symlink needed). Codex/Cursor/Copilot
  need no shim. So **one `AGENTS.md` + two tiny shims covers all five, with no symlinks.**
- **Bati already has the machinery:** it composes the output `README.md` from per-boilerplate
  `$README.md.ts` fragments. The instruction file(s) follow the same fragment-composition pattern and can
  reuse `README`/`nextSteps()`/`features.ts` docs links as source material. Bati does **not** currently
  emit any `AGENTS.md`/`CLAUDE.md` into the output — this feature adds them per selected agent.

## 4. Target AI agents — new `features.ts` category (decided 2026-06-16)

Each agent is a **feature flag** in a **new multi-select category** (proposed label **"AI Agent"**), so it
shows up in the CLI and the batijs.dev selector alongside Server/Auth/etc. Selecting flag(s) is the opt-in
and picks destination path(s). The **same content** is written to each selected agent's **project paths**
(global paths are user-level installs, out of scope — shown for reference).

| Flag | Agent | Native skills dir | Also auto-reads | Instruction file |
|---|---|---|---|---|
| `claude` | Claude Code | `.claude/skills/` | — | `CLAUDE.md` (→ `@AGENTS.md`) |
| `codex` | OpenAI Codex | `.agents/skills/` ⚠️ **not** `.codex/` | — | `AGENTS.md` (native) |
| `gemini` | Gemini CLI | `.gemini/skills/` | `.agents/skills/` | `GEMINI.md` (→ `@AGENTS.md`) |
| `cursor` | Cursor | `.cursor/skills/` | `.agents/skills/`, `.claude/skills/` | `AGENTS.md` (native) |
| `copilot` | GitHub Copilot | `.github/skills/` | `.agents/skills/`, `.claude/skills/` | `AGENTS.md` (native) |

> **Key consequence (§15):** `.agents/skills/` is the canonical standard read by Codex/Gemini/Cursor/Copilot;
> only Claude needs `.claude/skills/`. So **two dirs cover all five agents** — see the linking strategy below.
> Global `~/.<agent>/skills/` paths are user-level installs, out of scope.

`features.ts` work this implies:
- New category (label TBD) with the 5 flags above — `category`, `label`, `flag`, icon (base64 svg per
  agent), docs `links`. Multi-select; no `ERROR_*` rules expected (agents are orthogonal to the stack).
- `BatiSet` helpers: `hasAiAgent` (any selected) + per-flag `has("claude")` checks the skill boilerplates
  gate on, plus an accessor mapping selected flags → destination dirs / instruction-file paths.
- Website selector picks the category up automatically once it's in `features.ts`.

Linking / de-duplication strategy (updated 2026-06-16 after the §15 spike):
- **Canonical dir = `.agents/skills/`** — the cross-tool standard, read natively by **Codex, Gemini,
  Cursor, Copilot**. Write each skill here once when any of those four is selected.
- **Claude** is the only agent that doesn't read `.agents/skills/` → also write **`.claude/skills/`** when
  `claude` is selected (symlink → `.agents/skills/` on POSIX local-FS, else copy). So **≤2 dirs cover all
  five agents**, not five. **Decided: minimal** — emit only `.agents/skills/` (when any non-Claude agent is
  selected) + `.claude/skills/` (when Claude is selected); native mirrors (`.gemini/`, `.cursor/`,
  `.github/skills/`) are redundant and **not** emitted.
- **Symlink vs copy:** symlink only on **POSIX local-FS**; **copy fallback** for Windows (`core.symlinks` /
  broken placeholders) and the batijs.dev **zip / StackBlitz** download. Frontmatter is uniform
  (`name`+`description` everywhere; `allowed-tools`/`license` optional, ignored where unsupported), so each
  `SKILL.md` is byte-identical across dirs — copy is cheap, symlink is safe.
- **Instruction files:** canonical `AGENTS.md` + `@AGENTS.md` shims for `CLAUDE.md`/`GEMINI.md` (§3) — no
  symlinks.

## 5. Granularity (decided 2026-06-16 — hybrid)

Framing: Bati generates **one app with one selected stack**, so the *output* has only one server / deploy
/ framework skill regardless. The decision is about **authoring in the Bati repo**. Three mechanisms:

- **(a) Per-feature static `SKILL.md`** — one file per boilerplate, gated by its existing `if()`.
  Pros: matches Bati's per-boilerplate ownership; no conditional logic; new boilerplate just drops a file.
  Cons: shared prose duplicated across siblings (drift risk); cross-cutting skills don't fit.
- **(b) Adaptive inline `$$.BATI` markers in one static `SKILL.md`.** Pros: single source of truth.
  Cons: **templating prose is the fragile path** — codegraft conditionals target code/JSX/CSS/HTML;
  Markdown only has next-sibling HTML-comment conditionals. **Avoid.**
- **(c) Adaptive dynamic `$SKILL.md.ts`** — body composed in TS from `meta.BATI` (exactly like the existing
  `$README.md.ts`). Pros: full programmatic control; best for whole-stack content. Cons: centralizes ownership.

**Decided — hybrid:** **(a)** for *feature* skills (server, deploy, orm, auth, css, analytics, lint,
component libs, error tracking, tooling) — each boilerplate owns its `SKILL.md`. **(c)** for the always-on
*whole-stack* core that depends on the full `BatiSet` (which §3 routes into the instruction file). Never **(b)**.

**Composer / fan-out:** skills target **multiple destination dirs** (one per selected agent), which doesn't
fit the standard "`files/` → app root" copy. So **(a)** and **(c)** only produce skill *content*; a **central
skill composer** (1) collects declared skills from selected boilerplates, (2) gates them on the selected
feature set, (3) fans each out into every selected agent's skills dir, and (4) emits the instruction file(s).

---

## 6. Candidate skill catalog (ALL relevant)

Legend:
- **Gate** = the `BatiSet` condition / flag(s) that emit the skill. **All gates are implicitly AND-ed with
  `hasAiAgent`** (≥1 agent selected); with no agent selected nothing is generated. `always` = "whenever an
  agent is selected".
- **Author** = mechanism per §5: **(a)** per-feature static, **(c)** dynamic composed.
- Single-select categories (UI framework, server, deploy) only ever produce **one** skill per output app.

### A. Always-on core → **instruction file** (§3), not discrete skills — author **(c)**

| Item | Gate | Content |
|---|---|---|
| `project-overview` | always | Map of the scaffold: directory layout, entry points, where pages/server/db/config live, build outputs. |
| `dev-workflow` | always (adapts to `BATI.pm`) | Package manager (npm/pnpm/yarn/bun), `package.json` scripts, run dev / build / preview, install a dependency. |
| `env-and-secrets` | always (shared-env; adapts to `hasDotEnvSecrets`) | How env vars are loaded & typed, `.env` vs `wrangler.jsonc`, adding a var, scopes/groups (mirrors `env-registry`). |

### B. Vike core (always present — the framework conventions LLMs most often get wrong) — skills, author **(c)**

| Skill | Gate | Teaches |
|---|---|---|
| `vike-routing` | always | `+Page`, `+route`, filesystem routing, route params, `_error` page, `+Layout`/`+Wrapper`. |
| `vike-data-fetching` | always | `+data`, `useData`, `passToClient`, server vs client data, `+guard`. |
| `vike-config` | always | `+config.ts`, global vs page config, `+Head`/`+title`, meta/hooks, `vike-react`/`vike-vue`/`vike-solid` settings. |
| `vike-ssr-server` | `hasServer` | SSR via `vike-server`, the server entry, SSR vs SPA vs pre-render. |

### C. UI framework (exactly one selected) — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `react-conventions` | `react` | `vike-react`, components, hooks, SSR-safe patterns. |
| `vue-conventions` | `vue` | `vike-vue`, SFC conventions. |
| `solid-conventions` | `solid` | `vike-solid`, signals, SSR patterns. |

### D. CSS / styling — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `tailwindcss` | `tailwindcss` | Config, class conventions, global stylesheet location. |
| `compiled-css` | `compiled-css` | Compiled CSS-in-JS usage in this app. |

### E. UI component libraries — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `shadcn-ui` | `shadcn-ui` | Adding components via the shadcn CLI, `components.json`, registry/aliases. |
| `daisyui` | `daisyui` | daisyUI component classes + themes. |
| `mantine` | `mantine` | Mantine components, provider/theme setup. |

### F. Data fetching / RPC (the layer agents most need to extend) — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `telefunc` | `telefunc` | `.telefunc.ts` placement, `shield`, calling from the client, abort/guards. |
| `trpc` | `trpc` | Defining a procedure, wiring the router, the client, where the router lives. |
| `ts-rest` | `ts-rest` | Contract definition, server router, client usage. |

### G. Server (exactly one when `hasServer`) — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `server-hono` | `hono` | Add a route / middleware, server entry, `vike-server` integration. |
| `server-express` | `express` | ″ for Express. |
| `server-fastify` | `fastify` | ″ for Fastify. |
| `server-elysia` | `elysia` | ″ for Elysia. |

### H. Database engine — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `db-sqlite` | `sqlite` && !`hasD1` | better-sqlite3 client, connection, db file location. |
| `db-postgres` | `postgres` | postgres.js client, connection string, env wiring. |
| `db-d1` | `hasD1` (cloudflare+sqlite) | Cloudflare D1 binding, wrangler config, local vs remote, migrations. |
| `db-todo-demo` | `hasDbDemo` | The scaffolded todo demo data layer (shared-db): how todos persist, where to extend. |

### I. ORM / query builder (combination-sensitive) — author **(a)**

| Skill | Gate | Teaches | Variants |
|---|---|---|---|
| `orm-drizzle` | `drizzle` | Schema location, queries, migrations (drizzle-kit). | sqlite / postgres / d1 |
| `orm-kysely` | `kysely` | Types/schema, queries, migrations. | sqlite / postgres / d1 |
| `orm-prisma` | `prisma` | `schema.prisma`, client, `migrate`/`generate` (self-managed). | sqlite / postgres |

### J. Auth (framework-variant-sensitive) — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `auth-better-auth` | `better-auth` | Config, server routes, session, client; react/vue/solid variants. |
| `auth-authjs` | `authjs` | Auth.js setup, providers, session access. |
| `auth-auth0` | `auth0` | Auth0 provider config (incl. Auth.js Auth0 provider). |
| `auth-route-guards` | any auth | Protecting routes via Vike `+guard`, redirect patterns (cross-cuts with `vike-data-fetching`). |

### K. Hosting / deploy (exactly one host) — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `deploy-cloudflare` | `cloudflare` | wrangler, D1 bindings, secrets via wrangler, deploy command. |
| `deploy-edgeone` | `edgeone` | EdgeOne Pages deploy + Vike integration. |
| `deploy-vercel` | `vercel` | Vercel build/deploy specifics. |
| `deploy-netlify` | `netlify` | Netlify build/deploy specifics. |
| `deploy-aws` | `aws` | AWS Lambda packaging/deploy. |
| `deploy-docker` | `docker` | Dockerfile/compose, build & run the image. |
| `deploy-dokploy` | `dokploy` | Dokploy deploy flow. |
| `deploy-node` | `hosting-diy` (self-host node) | Universal-deploy node server, build/preview/start. |

### L. Linting / formatting — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `lint-eslint` | `eslint` | Config location, run, autofix. |
| `lint-oxlint` | `oxlint` | ″ for Oxlint. |
| `lint-biome` | `biome` | ″ for Biome (lint+format). |
| `format-prettier` | `prettier` | Prettier config, format command. |

### M. Error tracking — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `sentry` | `sentry` | Setup, capturing errors, source maps; react/vue/solid variants. |
| `logrocket` | `logrocket` | Init + session capture. |

### N. Analytics — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `analytics-plausible` | `plausible.io` | Plausible setup + custom events. |
| `analytics-google` | `google-analytics` | GA tag + events. |
| `analytics-segment` | `segment` | Segment init + tracking. |

### O. Tooling — author **(a)**

| Skill | Gate | Teaches |
|---|---|---|
| `storybook` | `storybook` | Adding stories, running Storybook, config location. |

---

## 7. Summary counts

- **~52 candidate items** across 15 groups (testing dropped).
- Group A (3 items) → **instruction file** (§3), not discrete skills, leaving **~49 skills**.
- Everything is gated on **`hasAiAgent`** (≥1 agent flag); no agent selected → nothing generated (this is
  what makes a separate `--skills` flag redundant).
- ~4 **Vike-core** skills (author **(c)**); the rest **per-feature** (author **(a)**). A given output app
  ships only the skills for its selected features (typically ~8–15), × each selected agent dir.

## 8. Authoring API & composer design (decided 2026-06-16)

**Implemented (v1): a `skills(meta)` config function** in `bati.config.ts`, parallel to
`env`/`deploy`/`nextSteps`. Each boilerplate returns `BatiSkill[]` (`{ name, description, body,
allowedTools? }`), gated on `meta`. Rationale: it needs no new file-discovery in the compile pipeline,
matches the existing config surface, and suits the **lean, reference-upstream-docs** skills decided in
§10/§13 (short bodies as inline strings are fine; the dir convention's ergonomic win only matters for long
prose, which we're deliberately avoiding). Lives in `packages/core/src/skills.ts` (`BatiSkillFactory`).

**Deferred option — a `skills/` dir per boilerplate** (sibling to `files/`) with static `SKILL.md` /
dynamic `$SKILL.md.ts`. Revisit only if skill bodies outgrow inline strings; the composer contract (below)
wouldn't change, only how content is sourced.

**Frontmatter authored once, normalized per agent by the composer.** Source = `name`, `description`,
optional `allowed-tools`. The composer strips/translates fields an agent doesn't support, so one source
serves all agents and "format portability" is a composer concern, not an authoring one.

**Composer pipeline** (`packages/core/src/skills.ts` + `agents-md.ts`, parallels `env-registry.ts`):
1. Collect `skills(meta)` from all selected boilerplates (`filteredBoilerplates.flatMap(b => b.config.skills?.(meta))`).
2. Validate: unique skill `name`s across boilerplates (`composeAgentFiles` throws on collision).
3. Generate the canonical **`AGENTS.md`** body centrally via `buildAgentsMd(meta, pmRun)` (§6.A).
4. `composeAgentFiles` writes each skill to the minimal dir set (`resolveSkillDirs`) + the instruction
   files (`resolveInstructionFiles`): native `AGENTS.md` + `@AGENTS.md` shims. v1 = copy (symlink later, §4).
5. Skip everything when `!hasAiAgent` (enforced in the CLI + `composeAgentFiles`).

These conventions (the `skills(meta)` config field, `BatiSkill` shape, frontmatter rules, composer routing)
are **documented in Bati's own `AGENTS.md`** — a new "Authoring AI-agent skills" section — since the skills
are AI-maintained (§13) and `AGENTS.md` is the existing home for boilerplate/codegraft conventions.

## 9. Combination handling (resolved)

- **Framework × feature** (auth, error tracking): **reuse the existing UI-specific boilerplates.** Bati
  already splits `react-better-auth` / `vue-better-auth` / `solid-better-auth` and `react-sentry` /
  `vue-sentry` / `solid-sentry`. Put the framework-specific skill in that boilerplate's `skills/` dir; its
  combined `if()` (`better-auth && react`, …) gates it automatically — **no templating**.
- **ORM × DB engine** (drizzle/kysely × sqlite/postgres/d1): base ORM is one boilerplate → use a **dynamic
  `$SKILL.md.ts`** branching on `BATI.hasD1` / `postgres` / `sqlite` for the few differing lines
  (connection, migration command). D1 has dedicated boilerplates (`d1`, `d1-kysely`, `d1-sqlite`), so
  D1-specific content can live there instead.
- **Server, deploy, UI framework** (single-select): one static skill per boilerplate — no combination.

## 10. Reuse of existing artifacts

Source from what exists to avoid drift:
- **`features.ts` `links`** → each skill's "References" section pulls the feature's official doc URLs.
- **`nextSteps()`** overlaps `dev-workflow` / deploy content → factor shared strings, don't re-author.
- **`$README.md.ts`** fragments overlap `project-overview` → the instruction file references the generated
  `README.md` (or shares a fragment source) rather than duplicating.
- v1 stance: instruction file + skills **reference** the README and doc links; extract a shared content
  module only if duplication becomes painful.

## 11. Bundled scripts — deferred to v2

v1 is **instructions-only** (`SKILL.md` prose + optional `reference.md`). Runnable helpers ("scaffold a
page", "new migration") add real complexity — executable, package-manager-aware, security/permissions,
cross-OS — and aren't needed for the core value. Revisit in v2.

## 12. Phasing

- **v1 (MVP):** all 5 agent flags; **copy-only** into the minimal dir set (`.agents/skills/` + Claude's
  `.claude/skills/`, §4); instruction file (`AGENTS.md` + `@AGENTS.md` shims for Claude/Gemini); and the
  highest-value skills — **Vike core** (routing, data, config) + the big extension points **server,
  data-fetching/RPC, db/orm, auth**. Where agents add most value and LLMs err most.
- **v1.1:** symlink optimization (POSIX / local-FS) per §4.
- **v2:** the long tail — css, component libs, analytics, error tracking, deploy-per-host, lint/format,
  storybook — plus bundled scripts (§11) and per-agent frontmatter edge cases.

---

## 13. Open questions & decisions

Resolved this pass: authoring API (§8), combination handling (§9), reuse (§10), scripts deferred (§11),
phasing (§12), linking & instruction-file dedup (§3/§4).

Decided 2026-06-16:
- **Spike done (§15)** — resolved the two highest-risk questions: all 5 agents load `SKILL.md` skills today;
  canonical `.agents/skills/` + `.claude/skills/` covers all five; `AGENTS.md` + `@AGENTS.md` shims for
  Claude/Gemini, native AGENTS.md for Codex/Cursor/Copilot. `.codex/skills/` corrected to `.agents/skills/`.
- **Existing-file collision → out of scope for v1.** Assume fresh scaffolds; handling a pre-existing
  `AGENTS.md` / `CLAUDE.md` / `.claude/` (skip / merge / overwrite) is deferred.
- **Maintenance = AI-maintained.** No dedicated human owner; the authoring + upkeep conventions live in
  **Bati's own `AGENTS.md`** (new "Authoring AI-agent skills" section, §8) so any agent maintaining the repo
  follows them consistently. To keep upkeep tractable and minimize version drift, skills stay **lean and
  reference upstream docs** (via `features.ts` links, §10) rather than duplicating volatile API detail.
- **Skills-dir output = minimal (§4).** Emit only `.agents/skills/` (+ `.claude/skills/` for Claude); no
  per-agent native mirrors.

Still open:
1. **Linking capability detection** (OS + output channel) and confirming the zip / StackBlitz path copies (§4).

## 14. Next steps

- [x] Decisions locked: granularity (§5), authoring API + composer (§8), combination handling (§9),
      reuse (§10), scripts deferred (§11), phasing (§12), linking/dedup (§3/§4).
- [x] **Spike done (§15):** all 5 agents load `SKILL.md`; `.codex/skills/` → `.agents/skills/`;
      `.agents/skills/` + `.claude/skills/` covers all five; AGENTS.md + `@AGENTS.md` shims confirmed.
- [x] Implemented: "AI Agent" `features.ts` category + 5 flags (claude/codex/gemini/cursor/copilot) with
      links; `BatiSet.hasAiAgent` + `aiAgents`; and `ai-agents.ts` (per-agent metadata + `resolveSkillDirs`
      / `resolveInstructionFiles` encoding the §3/§4 rules) with unit tests. Agent icons (`image`) still TODO.
- [x] Composer implemented (copy-only, v1): `core/src/skills.ts` (`renderSkillMd`, `composeAgentFiles`),
      `core/src/agents-md.ts` (`buildAgentsMd`), `skills?(meta)` field in `BatiConfig`, wired into the CLI
      (writes files when `hasAiAgent`). Unit tests + manual e2e verified (AGENTS.md + CLAUDE/GEMINI shims).
- [x] Authored the v1 skill set (§12) via `skills(meta)` producers: Vike core (shared) + server
      (hono/express/fastify/elysia) + data-fetching (telefunc/trpc/ts-rest) + ORM (drizzle/kysely/prisma,
      engine-aware) + auth (better-auth/authjs/auth0).
- [x] Documented the authoring convention in Bati's own `AGENTS.md` ("Authoring AI-agent skills").
- [ ] E2E: assert correct skill / instruction files per flag combo via file-check mode (`mode: "none"`). **← next**
- [ ] Later: agent icons (`image`), symlink optimization (§4, v1.1), per-boilerplate `skills/` dir option (§8),
      remaining catalog skills (css, component libs, deploy-per-host, analytics, error tracking, storybook).

---

## 15. Spike results — per-agent skills & instruction-file support (verified 2026-06-16)

Verdict (all 5 agents, checked against official docs; no sources blocked): **`SKILL.md` "Agent Skills" is
now a cross-tool standard — all five agents load `SKILL.md` skills today**, so nothing needs to be folded
into instruction files. Two corrections to earlier assumptions:

- ❌ **`.codex/skills/` is NOT a Codex project path.** Codex reads project skills from **`.agents/skills/`**
  (`~/.codex/skills/` is personal-only). The other asserted paths are real: `.claude/skills/`,
  `.gemini/skills/`, `.cursor/skills/`, `.github/skills/`.
- ✅ **`.agents/skills/` is the canonical standard** read by Codex, Gemini, Cursor, Copilot. Cursor and
  Copilot also auto-read `.claude/skills/`. Only **Claude** is limited to `.claude/skills/`.

Frontmatter: only `name` + `description` required everywhere (Copilot also allows `allowed-tools`/`license`).
One `SKILL.md` body is reusable verbatim across all agents — only the directory differs.

Instruction files / imports:
- **AGENTS.md native** for **Codex, Cursor, Copilot**.
- **Claude** reads only `CLAUDE.md`; **Gemini** needs config to read AGENTS.md — but both support `@path`
  import (Claude depth 4, Gemini depth 5), so a one-line `@AGENTS.md` shim works for exactly the two that
  need it. **Codex & Copilot have no import directive** (concatenate/aggregate) → rely on native AGENTS.md.
  Cursor's `@filename` is a context-attach, not a text import → native AGENTS.md territory too.
- Net: **canonical `AGENTS.md` + `@AGENTS.md` shims for `CLAUDE.md`/`GEMINI.md` + native AGENTS.md for
  Codex/Cursor/Copilot.** The two agents lacking native AGENTS.md are precisely the two with `@` imports.

Implications applied: §3 (instruction table + notes), §4 (skills paths + canonical `.agents/skills/`
linking), §12 (v1 dir set), §13 (#1/#2 resolved). Sources: code.claude.com/docs (skills, memory),
developers.openai.com/codex (skills, agents-md), github.com/google-gemini/gemini-cli docs, cursor.com/docs
(skills, rules), docs.github.com/copilot + VS Code agent-skills docs + the 2025-12-18 Copilot changelog.

Lower-confidence residue: exact VS Code version for default-on AGENTS.md; Copilot nested-AGENTS.md
specifics; Gemini extension-schema details.
