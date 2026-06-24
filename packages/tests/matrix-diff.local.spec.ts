import { describe, expect, test } from "vitest";
import { buildCombos, type Combo, comboKey } from "./e2e/combos.js";

// Phase 3 replaces this stub with `generateMatrix(buildGraph(), verify)`. Until then it returns no
// combos, so the diff reports the whole current matrix as "not yet generated" — the baseline the
// generator shrinks against as it comes online.
function generateMatrix(): Combo[] {
  return [];
}

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

describe("matrix generation parity", () => {
  const current = buildCombos();
  const generated = generateMatrix();
  const { missing, extra } = delta(current, generated);

  test("reports the delta between generated and current", () => {
    console.log(`[matrix-diff] current=${current.length} generated=${generated.length}`);
    console.log(`[matrix-diff] missing (current − generated): ${missing.length}`);
    for (const c of missing.slice(0, 10)) console.log(`  - ${label(c)}`);
    if (missing.length > 10) console.log(`  … ${missing.length - 10} more`);
    console.log(`[matrix-diff] extra (generated − current): ${extra.length}`);
    for (const c of extra.slice(0, 10)) console.log(`  + ${label(c)}`);

    // The harness itself must be sound: a non-empty, fully-deduped current matrix.
    expect(current.length).toBeGreaterThan(0);
    expect(new Set(current.map(comboKey)).size).toBe(current.length);
  });

  // Phase 5 flips this on: once the generator is authoritative, both deltas are empty (or an
  // explicit, reviewed allowlist).
  test.todo("generated matrix equals current (cutover gate)");
});
