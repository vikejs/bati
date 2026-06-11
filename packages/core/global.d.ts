/** biome-ignore-all lint/suspicious/noExplicitAny: type definitions */
import type { BatiSet } from "@batijs/features";
import type { UnionToIntersection, Values } from "./type-utils.js";

declare global {
  // Build-time marker the codemods resolve away; ambient so boilerplate source type-checks against
  // `$$.BATI.has(...)` / `$$.BATI_TEST` before generation. Never exists at runtime.
  const $$: {
    BATI: BatiSet;
    BATI_TEST: boolean;
  };

  // Merged namespace for the erased-at-build type constructs (`x as $$.Any`, `$$.If<…>`).
  namespace $$ {
    type Any = any;

    type If<
      T extends Partial<Record<string, any>>,
      Mode extends "union" | "intersection" = "intersection",
    > = Mode extends "intersection" ? UnionToIntersection<Values<T>> : Values<T>;
    type IfAsUnknown<
      T extends Partial<Record<string, any>>,
      Mode extends "union" | "intersection" = "intersection",
    > = If<T, Mode>;
  }
}
