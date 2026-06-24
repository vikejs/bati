import { features } from "@batijs/features";
import { buildGraph, type InteractionGraph } from "@batijs/graft-graph";
import { auth, Balancer, comboErrors, data, db, framework, orm, server } from "@batijs/tests-utils";
import { type Combo, inferKind } from "./combos.js";
import { envAvailable } from "./verify.js";

const categoryOf = new Map<string, string>(features.map((f) => [f.flag, f.category]));

// Declared ride-alongs: ubiquitous axes that ride along balanced rather than anchoring a cluster.
// Framework and Linter touch everything; Hosting (deploy) is layered on separately.
const RIDE_ALONG = new Set(["UI Framework", "Linter", "Hosting"]);
// A category pair backed by at least this many flag-edges is a structural interaction; fewer is
// incidental page co-location (e.g. a demo page using both a CSS class and a data fetch).
const INTERACTION_WEIGHT_MIN = 5;
const LINTERS = ["eslint", "biome", "oxlint"];

// The backend axes, by category label. A backend cluster member missing here is a signal to add an
// axis — the assertion in `generateMatrix` surfaces it.
const axisByCategory = {
  Server: server,
  "Data fetching": data,
  Database: db,
  "ORM / Query builder": orm,
  Auth: auth,
} satisfies Record<string, { name: string; values: readonly string[] }>;

/** Every valid backend combo — the constrained space the generated suite must cover pairwise. */
export async function backendValidCombos(): Promise<string[][]> {
  const axes: (string | null)[][] = backendCategories(await buildGraph()).map((category) => {
    const axis = axisByCategory[category as keyof typeof axisByCategory];
    if (!axis) throw new Error(`backend category has no axis: ${category}`);
    // Server anchors every backend combo (all others require it); the rest are optional. Env-gated
    // values (auth0) drop when their credentials are absent.
    const values = axis.values.filter(envAvailable);
    return axis.name === "server" ? values : [...values, null];
  });

  return crossProduct(axes)
    .map((row) => row.filter((v): v is string => v !== null))
    .filter((flags) => comboErrors(flags).length === 0);
}

/** The backend suite, derived from the graph: a constraint-aware pairwise covering array over the
 *  cluster's axes (only valid combos selected, so no post-filter coverage holes), with framework a
 *  balanced ride-along and linters appended. */
export async function generateMatrix(): Promise<Combo[]> {
  const balancer = new Balancer();
  return coverPairwise(await backendValidCombos()).map((flags) => ({
    flags: [balancer.pick(framework), ...flags, ...LINTERS],
    mode: "dev",
    kind: inferKind(flags),
  }));
}

/** The largest cluster of non-ride-along categories whose interactions are structural — the backend
 *  (server / data / database / ORM / auth). */
function backendCategories(graph: InteractionGraph): string[] {
  const weight = new Map<string, number>();
  for (const [a, b] of graph.edges) {
    const ca = categoryOf.get(a)!;
    const cb = categoryOf.get(b)!;
    if (ca === cb || RIDE_ALONG.has(ca) || RIDE_ALONG.has(cb)) continue;
    const key = ca < cb ? `${ca}\t${cb}` : `${cb}\t${ca}`;
    weight.set(key, (weight.get(key) ?? 0) + 1);
  }

  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    let neighbors = adjacency.get(a);
    if (!neighbors) adjacency.set(a, (neighbors = new Set()));
    neighbors.add(b);
  };
  for (const [key, n] of weight) {
    if (n < INTERACTION_WEIGHT_MIN) continue;
    const [a, b] = key.split("\t");
    link(a, b);
    link(b, a);
  }

  return largestComponent(adjacency);
}

function largestComponent(adjacency: Map<string, Set<string>>): string[] {
  const seen = new Set<string>();
  let largest: string[] = [];
  for (const start of adjacency.keys()) {
    if (seen.has(start)) continue;
    const component: string[] = [];
    const stack = [start];
    seen.add(start);
    while (stack.length) {
      const node = stack.pop()!;
      component.push(node);
      for (const next of adjacency.get(node)!) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    if (component.length > largest.length) largest = component;
  }
  return largest.sort();
}

function crossProduct<T>(axes: T[][]): T[][] {
  let rows: T[][] = [[]];
  for (const axis of axes) rows = rows.flatMap((row) => axis.map((value) => [...row, value]));
  return rows;
}

export const pairKeys = (flags: string[]): string[] => {
  const sorted = [...flags].sort();
  const keys: string[] = [];
  for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) keys.push(`${sorted[i]}\t${sorted[j]}`);
  return keys;
};

/** Greedy t=2 cover over a set of valid combos: repeatedly take the combo closing the most still-open
 *  pairs. Every pair comes from a real combo, so it terminates with full coverage and no holes. */
function coverPairwise(combos: string[][]): string[][] {
  const open = new Set<string>();
  for (const combo of combos) for (const key of pairKeys(combo)) open.add(key);

  const chosen: string[][] = [];
  while (open.size > 0) {
    let best = combos[0];
    let bestGain = -1;
    for (const combo of combos) {
      const gain = pairKeys(combo).reduce((n, key) => n + (open.has(key) ? 1 : 0), 0);
      if (gain > bestGain) {
        bestGain = gain;
        best = combo;
      }
    }
    for (const key of pairKeys(best)) open.delete(key);
    chosen.push(best);
  }
  return chosen;
}
