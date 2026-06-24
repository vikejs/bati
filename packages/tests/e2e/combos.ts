import { auth as authAxis, Balancer, data as dataAxis, db as dbAxis, orm as ormAxis } from "@batijs/tests-utils";
import matrix, { type Kind, type Mode } from "./matrix.js";

export interface Combo {
  flags: string[];
  mode: Mode;
  kind?: Kind; // suite identity; its presence also triggers a smoke pass
}

// The kind drives which assertion pass runs (data round-trip / auth flows / cloudflare deploy) and,
// where present, a smoke pass. Infer it from the feature axes the flags touch.
export function inferKind(flags: string[]): Kind | undefined {
  const touches = (axis: { values: readonly string[] }) => flags.some((f) => axis.values.includes(f));
  if (touches(authAxis)) return "auth";
  if (touches(dataAxis) || touches(dbAxis) || touches(ormAxis)) return "data";
  if (flags.includes("cloudflare")) return "cloudflare";
  return undefined;
}

// Canonical identity of a combo: flags are order-insensitive, mode and kind complete it. Two suites
// emitting the same flags+mode+kind are the same combo (deduped on this key).
export function comboKey(combo: Combo): string {
  return JSON.stringify([[...combo.flags].sort(), combo.mode, combo.kind ?? ""]);
}

// The shared Balancer keeps `.spread()` round-robin global across suites.
export function buildCombos(): Combo[] {
  const balancer = new Balancer();
  const seen = new Set<string>();
  const combos: Combo[] = [];
  for (const s of matrix) {
    for (const flags of s.flatten(balancer)) {
      const combo: Combo = { flags, mode: s.runMode ?? "dev", kind: s.suiteKind };
      const key = comboKey(combo);
      if (!seen.has(key)) {
        seen.add(key);
        combos.push(combo);
      }
    }
  }
  return combos;
}
