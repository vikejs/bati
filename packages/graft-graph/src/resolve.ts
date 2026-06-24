import { BatiSet, type Flags, features, flags } from "@batijs/features";

const FLAG_CALL = /\bhas\(\s*["']([^"']+)["']\s*\)/g; // `BATI.has("flag")`
const GETTER = /\bhas[A-Z]\w*\b/g; // `BATI.hasDatabase`, `BATI.hasD1`, …

const make = (selected: string[]) => new BatiSet(selected as Flags[], features, "npm");
const read = (set: BatiSet, getter: string) => (set as unknown as Record<string, boolean>)[getter];

/**
 * Each `BatiSet` getter → the flags whose presence influences it, derived by probing `BatiSet` itself
 * rather than restating its logic (so a new getter is covered automatically). A flag influences a
 * getter when adding it to some probe set flips the result; empty + single-flag bases cover the
 * single- and pairwise-conjunctive getters the codebase has (`hasD1` = cloudflare + sqlite).
 */
const getterFlags: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const getters = Object.getOwnPropertyNames(BatiSet.prototype).filter(
    (name) => name.startsWith("has") && Object.getOwnPropertyDescriptor(BatiSet.prototype, name)?.get,
  );
  const influence = new Map(getters.map((g) => [g, new Set<string>()]));
  for (const base of [[] as string[], ...flags.map((f) => [f])]) {
    const baseSet = make(base);
    for (const flag of flags) {
      if (base.includes(flag)) continue;
      const withFlag = make([...base, flag]);
      for (const g of getters) if (read(withFlag, g) !== read(baseSet, g)) influence.get(g)!.add(flag);
    }
  }
  return influence;
})();

/** The feature flags a raw reference names: literal `has("x")` flags, plus every flag a referenced
 *  getter depends on. */
export function resolveFlags(ref: string): Set<string> {
  const out = new Set<string>();
  for (const m of ref.matchAll(FLAG_CALL)) out.add(m[1]);
  for (const m of ref.matchAll(GETTER)) for (const f of getterFlags.get(m[0]) ?? []) out.add(f);
  return out;
}
