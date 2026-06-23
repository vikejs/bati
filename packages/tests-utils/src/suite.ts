/**
 * Chainable suite API — replaces the `matrix` + `exclude` exports.
 *
 * Authors describe what they DO want to test (include-only), and `.spread()`
 * picks a single framework per combo with global round-robin balancing so
 * vue / react / solid each get roughly equal coverage across the whole repo.
 *
 * `matrix.ts` exports an array of `Suite`s; the runner calls `flatten(balancer)`
 * on each to resolve spread markers into the final `string[][]` combos.
 */

import { type CategoryLabels, features } from "@batijs/features";
import { execRules, RulesMessage } from "@batijs/features/rules";

// ---------- Axes ----------

export interface Axis<V extends string = string> {
  readonly __axis: true;
  readonly name: string;
  readonly values: readonly V[];
}

function defineAxis<V extends string>(name: string, values: readonly V[]): Axis<V> {
  return { __axis: true, name, values };
}

// Flags belonging to a given feature category, with literal types preserved
// from `@batijs/features` (the features array is declared `as const`).
type FlagsInCategory<C extends CategoryLabels> = Extract<(typeof features)[number], { category: C }>["flag"];

function flagsIn<C extends CategoryLabels>(category: C): readonly FlagsInCategory<C>[] {
  return (
    features
      .filter((f): f is Extract<(typeof features)[number], { category: C }> => f.category === category)
      // biome-ignore lint/suspicious/noExplicitAny: cast
      .map((f) => f.flag) as any[]
  );
}

function categoryAxis<K extends string, C extends CategoryLabels>(name: K, category: C): Axis<FlagsInCategory<C>> {
  return defineAxis(name, flagsIn(category));
}

// Axes derived from feature categories — values stay in sync with
// `@batijs/features` automatically. Adding e.g. a new database to the
// "Database" category extends the `db` axis with no change here.
// The short axis names are an ergonomic alias for the longer category labels.
export const framework = categoryAxis("framework", "UI Framework");
export const server = categoryAxis("server", "Server");
export const data = categoryAxis("data", "Data fetching");
export const db = categoryAxis("db", "Database");
export const orm = categoryAxis("orm", "ORM / Query builder");
export const deploy = categoryAxis("deploy", "Hosting");
export const css = categoryAxis("css", "CSS");
export const auth = categoryAxis("auth", "Auth");
export const analytics = categoryAxis("analytics", "Analytics");

// ---------- Spread markers ----------

export interface SpreadMarker<V extends string = string> {
  readonly __spread: true;
  readonly axis: Axis<V>;
}

export function spread<V extends string>(axis: Axis<V>): SpreadMarker<V> {
  return { __spread: true, axis };
}

function isSpread(v: unknown): v is SpreadMarker {
  return typeof v === "object" && v !== null && (v as { __spread?: boolean }).__spread === true;
}

// ---------- Balancer (global round-robin) ----------

export class Balancer {
  // axisName -> value -> times picked
  private counts = new Map<string, Map<string, number>>();

  pick<V extends string>(axis: Axis<V>): V {
    let perAxis = this.counts.get(axis.name);
    if (!perAxis) {
      perAxis = new Map();
      this.counts.set(axis.name, perAxis);
    }
    // Pick the lowest-count value. Ties broken by declaration order in axis.values
    // → deterministic given a fixed spec-loading order.
    let bestValue: V = axis.values[0];
    let bestCount = perAxis.get(bestValue) ?? 0;
    for (const v of axis.values) {
      const c = perAxis.get(v) ?? 0;
      if (c < bestCount) {
        bestValue = v;
        bestCount = c;
      }
    }
    perAxis.set(bestValue, bestCount + 1);
    return bestValue;
  }
}

// ---------- Suite builder ----------

type ComboEntry = string | SpreadMarker;
type RawCombo = ComboEntry[];

type DimensionValue = string | SpreadMarker | null | undefined;
type Dimension = DimensionValue | readonly DimensionValue[];
type MatrixSpec = Record<string, Dimension>;
type CaseSpec = Record<string, DimensionValue | readonly DimensionValue[]>;

function toArray<T>(v: T | readonly T[]): readonly T[] {
  return Array.isArray(v) ? (v as readonly T[]) : [v as T];
}

function cartesian<T>(dims: readonly (readonly T[])[]): T[][] {
  if (dims.length === 0) return [[]];
  let acc: T[][] = [[]];
  for (const dim of dims) {
    const next: T[][] = [];
    for (const row of acc) {
      for (const v of dim) next.push([...row, v]);
    }
    acc = next;
  }
  return acc;
}

// Greedy all-pairs (pairwise) covering array: the smallest practical set of rows such that, for every
// pair of axes, every value-combination appears in at least one row. Each row anchors on a still-
// uncovered pair (so every row makes progress → termination), then fills the remaining axes to cover
// the most new pairs. Deterministic: ties resolve to the earliest-declared value, so a fixed input
// yields a fixed combo set (the `list` output stays stable across runs).
function coveringArray<T>(axes: readonly (readonly T[])[]): T[][] {
  const n = axes.length;
  if (n < 2 || axes.some((a) => a.length === 0)) return cartesian(axes);

  const key = (i: number, ai: number, j: number, aj: number) => `${i},${ai},${j},${aj}`;
  const uncovered = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let ai = 0; ai < axes[i].length; ai++) {
        for (let aj = 0; aj < axes[j].length; aj++) uncovered.add(key(i, ai, j, aj));
      }
    }
  }

  // Per-axis usage counts, so when several values cover equally many new pairs we prefer the
  // least-used one — the covering array stays minimal but spreads each axis's values evenly (e.g.
  // react/vue/solid get roughly equal representation) rather than front-loading the first-declared.
  const used = axes.map((a) => new Array<number>(a.length).fill(0));
  const rows: T[][] = [];
  while (uncovered.size > 0) {
    const [ai, vi, aj, vj] = (uncovered.values().next().value as string).split(",").map(Number);
    const choice = new Array<number>(n).fill(-1);
    choice[ai] = vi;
    choice[aj] = vj;
    for (let k = 0; k < n; k++) {
      if (choice[k] !== -1) continue;
      let bestIdx = 0;
      let bestGain = -1;
      for (let vk = 0; vk < axes[k].length; vk++) {
        let gain = 0;
        for (let m = 0; m < n; m++) {
          if (m === k || choice[m] === -1) continue;
          const [lo, loV, hi, hiV] = m < k ? [m, choice[m], k, vk] : [k, vk, m, choice[m]];
          if (uncovered.has(key(lo, loV, hi, hiV))) gain++;
        }
        // Higher gain wins; ties go to the least-used value, then to declaration order.
        if (gain > bestGain || (gain === bestGain && used[k][vk] < used[k][bestIdx])) {
          bestGain = gain;
          bestIdx = vk;
        }
      }
      choice[k] = bestIdx;
    }
    for (let i = 0; i < n; i++) {
      used[i][choice[i]]++;
      for (let j = i + 1; j < n; j++) uncovered.delete(key(i, choice[i], j, choice[j]));
    }
    rows.push(choice.map((idx, i) => axes[i][idx]));
  }
  return rows;
}

export type SuiteMode = "dev" | "prod" | "preview" | "docker" | "none";
export type SuiteKind = "data" | "auth" | "cloudflare";

export class Suite {
  private combos: RawCombo[] = [];
  private constants: string[] = [];

  /** Primary run mode (default "dev") + the optional kind (drives kind-scoped tests + a smoke pass). */
  runMode?: SuiteMode;
  suiteKind?: SuiteKind;

  /**
   * Cross product of named dimensions. `null` in a dimension list means
   * "this dimension is absent in that combo" (replaces the `undefined`
   * sentinel from the old API).
   *
   *   .matrix({ framework: "solid", server: ["hono", "express"], data: ["trpc", null] })
   *   → 4 combos: solid+hono+trpc, solid+hono, solid+express+trpc, solid+express
   */
  matrix(spec: MatrixSpec): this {
    const dims = Object.values(spec).map((v) => toArray(v));
    for (const row of cartesian(dims)) {
      this.combos.push(row.filter((v): v is ComboEntry => v !== null && v !== undefined));
    }
    return this;
  }

  /**
   * All-pairs covering array over the named dimensions: the smallest practical set of combos such
   * that every value-pair across any two dimensions appears in at least one combo. Same value
   * semantics as `.matrix()` (string | spread | null; null = dimension absent in that combo). Use it
   * instead of `.matrix()` when the dimensions interact pairwise but the full cross product is
   * redundant — e.g. server × data × ORM, where each pair matters but the exhaustive triples do not.
   */
  pairwise(spec: MatrixSpec): this {
    const dims = Object.values(spec).map((v) => toArray(v));
    for (const row of coveringArray(dims)) {
      this.combos.push(row.filter((v): v is ComboEntry => v !== null && v !== undefined));
    }
    return this;
  }

  /**
   * One explicit combo. Values may be a string, a spread marker, or an array
   * of either (e.g. `flags: ["sentry", "logrocket"]`).
   */
  case(spec: CaseSpec): this {
    const combo: ComboEntry[] = [];
    for (const v of Object.values(spec)) {
      if (v === null || v === undefined) continue;
      for (const item of toArray(v)) {
        if (item === null || item === undefined) continue;
        combo.push(item);
      }
    }
    this.combos.push(combo);
    return this;
  }

  /** Flags appended to every combo (linters are the canonical use). */
  linters(...flags: string[]): this {
    this.constants.push(...flags);
    return this;
  }

  mode(m: SuiteMode): this {
    this.runMode = m;
    return this;
  }

  kind(k: SuiteKind): this {
    this.suiteKind = k;
    return this;
  }

  /**
   * Resolve spread markers via the balancer, validate against Bati's feature
   * rules, and return final string[][]. Invalid combos (those that trigger an
   * `ERROR_*` rule in `@batijs/features/rules`) are dropped with a warning so
   * authors notice the issue at generation time, not when the CLI itself fails.
   *
   * Called by the test loader, not by spec authors.
   */
  flatten(balancer: Balancer): string[][] {
    const out: string[][] = [];
    for (const rawCombo of this.combos) {
      const resolved = rawCombo.map((entry) => (isSpread(entry) ? balancer.pick(entry.axis) : entry));
      // Dedupe within a combo — a spread might collide with a constant.
      const seen = new Set<string>();
      const combo: string[] = [];
      for (const flag of [...resolved, ...this.constants]) {
        if (seen.has(flag)) continue;
        seen.add(flag);
        combo.push(flag);
      }
      // Cast: combo strings are flag names (or any plain string passed to
      // `.case({ flags: "..." })`). execRules treats unknown strings as
      // category-or-flag and just won't match any rule.
      const errors = execRules(combo as Parameters<typeof execRules>[0], ruleMessageMap)
        .filter((m) => m.isError)
        .map((m) => m.name);
      if (errors.length > 0) {
        console.warn(`[suite] dropping invalid combo [${combo.join(", ")}]: ${errors.join(", ")}`);
        continue;
      }
      out.push(combo);
    }
    return out;
  }
}

// Pre-built once: maps every rule message enum value to `{ name, isError }`.
// We pass the full map (not just errors) so `execRules` doesn't log
// "No handler defined" warnings for WARN_/INFO_ rules.
const ruleMessageMap = (() => {
  const map = {} as Record<RulesMessage, { name: string; isError: boolean }>;
  for (const [name, value] of Object.entries(RulesMessage)) {
    if (typeof value === "number") {
      map[value as RulesMessage] = { name, isError: name.startsWith("ERROR_") };
    }
  }
  return map;
})();

export function suite(): Suite {
  return new Suite();
}
