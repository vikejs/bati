import { Balancer, suite } from "@batijs/tests-utils";
import { describe, expect, test } from "vitest";

// Fake axis values: prefixed so each combo row can be split back into its axis values, and unknown to
// the feature rules (execRules ignores non-flag strings), so `flatten` keeps every generated row.
const rows = (spec: Record<string, readonly (string | null)[]>) => suite().pairwise(spec).flatten(new Balancer());

describe("suite().pairwise() — all-pairs covering array", () => {
  test("covers every value-pair across every axis pair", () => {
    const X = ["x0", "x1", "x2", "x3"];
    const Y = ["y0", "y1", "y2", "y3"];
    const Z = ["z0", "z1", "z2"];
    const out = rows({ x: X, y: Y, z: Z });
    const covers = (a: string, b: string) => out.some((r) => r.includes(a) && r.includes(b));

    for (const axisPair of [
      [X, Y],
      [X, Z],
      [Y, Z],
    ] as const) {
      for (const a of axisPair[0]) for (const b of axisPair[1]) expect(covers(a, b), `${a}×${b}`).toBe(true);
    }

    // Strictly smaller than the full cross product — the whole point.
    expect(out.length).toBeLessThan(X.length * Y.length * Z.length);
    // Every value still appears at least once.
    for (const v of [...X, ...Y, ...Z])
      expect(
        out.some((r) => r.includes(v)),
        v,
      ).toBe(true);
  });

  test("null means 'dimension absent', and its pairs are still covered", () => {
    const S = ["s0", "s1"];
    const D = ["d0", null];
    const out = rows({ s: S, d: D });
    // (s0, absent) and (s1, absent) must each occur as a combo with only the s-value.
    expect(out.some((r) => r.length === 1 && r.includes("s0"))).toBe(true);
    expect(out.some((r) => r.length === 1 && r.includes("s1"))).toBe(true);
    // (s0,d0) and (s1,d0) covered.
    expect(out.some((r) => r.includes("s0") && r.includes("d0"))).toBe(true);
    expect(out.some((r) => r.includes("s1") && r.includes("d0"))).toBe(true);
  });

  test("fewer than two multi-value axes → enumerates the single axis", () => {
    expect(
      rows({ x: ["x0", "x1", "x2"] })
        .map((r) => r[0])
        .sort(),
    ).toEqual(["x0", "x1", "x2"]);
  });

  test("deterministic — same spec yields the same combos", () => {
    const spec = { a: ["a0", "a1", "a2"], b: ["b0", "b1", "b2"], c: ["c0", "c1"] };
    expect(rows(spec)).toEqual(rows(spec));
  });
});
