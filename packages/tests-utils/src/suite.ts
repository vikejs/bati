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
