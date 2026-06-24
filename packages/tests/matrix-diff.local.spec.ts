import { describe, expect, test } from "vitest";
import { buildCombos, type Combo, comboKey } from "./e2e/combos.js";
import { backendValidCombos, generateMatrix, pairKeys } from "./e2e/generate.js";

function delta(current: Combo[], generated: Combo[]) {
  const cur = new Set(current.map(comboKey));
  const gen = new Set(generated.map(comboKey));
  return {
    missing: current.filter((c) => !gen.has(comboKey(c))), // current − generated: intent to preserve
    extra: generated.filter((c) => !cur.has(comboKey(c))), // generated − current: new coverage / over-generation
  };
}

const label = (c: Combo) =>
  [c.flags.join("+"), c.kind, c.mode === "dev" ? undefined : c.mode].filter(Boolean).join(" ");

const current = buildCombos();
const generated = await generateMatrix();
const { missing, extra } = delta(current, generated);

describe("matrix generation parity", () => {
  test("reports the delta between generated and current", () => {
    console.log(`[matrix-diff] current=${current.length} generated=${generated.length}`);
    console.log(`[matrix-diff] missing (current − generated): ${missing.length}`);
    for (const c of missing.slice(0, 15)) console.log(`  - ${label(c)}`);
    if (missing.length > 15) console.log(`  … ${missing.length - 15} more`);
    console.log(`[matrix-diff] extra (generated − current): ${extra.length}`);
    for (const c of extra.slice(0, 15)) console.log(`  + ${label(c)}`);
    if (extra.length > 15) console.log(`  … ${extra.length - 15} more`);

    expect(generated.length).toBeGreaterThan(0);
    expect(new Set(generated.map(comboKey)).size).toBe(generated.length); // generator emits no duplicates
  });

  test("covers every satisfiable backend interaction pair (t=2, no holes)", async () => {
    const satisfiable = new Set<string>();
    for (const combo of await backendValidCombos()) for (const key of pairKeys(combo)) satisfiable.add(key);
    const covered = new Set<string>();
    for (const c of generated) for (const key of pairKeys(c.flags)) covered.add(key);

    const uncovered = [...satisfiable].filter((p) => !covered.has(p));
    expect(uncovered, `uncovered pairs: ${uncovered.join(", ")}`).toEqual([]);
  });

  // Phase 5 flips this on: once the generator is authoritative for the backend, its combos are all
  // valid coverage (the residue is reviewed and explicit).
  test.todo("generated backend matrix is reconciled with current (cutover gate)");
});
