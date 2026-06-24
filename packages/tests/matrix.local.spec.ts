import { describe, expect, test } from "vitest";
import { comboKey } from "./e2e/combos.js";
import { backendValidCombos, generateMatrix, pairKeys } from "./e2e/generate.js";
import matrix from "./e2e/matrix.js";

describe("matrix", () => {
  test("has no duplicate combos", () => {
    expect(new Set(matrix.map(comboKey)).size).toBe(matrix.length);
  });

  test("backend core covers every satisfiable interaction pair (t=2, no holes)", async () => {
    const satisfiable = new Set<string>();
    for (const combo of await backendValidCombos()) for (const key of pairKeys(combo)) satisfiable.add(key);
    const covered = new Set<string>();
    for (const combo of await generateMatrix()) for (const key of pairKeys(combo.flags)) covered.add(key);

    const uncovered = [...satisfiable].filter((p) => !covered.has(p));
    expect(uncovered, `uncovered pairs: ${uncovered.join(", ")}`).toEqual([]);
  });
});
