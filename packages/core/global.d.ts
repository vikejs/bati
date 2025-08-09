/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
/** biome-ignore-all lint/suspicious/noExplicitAny: type definitions */
import type { BatiSet } from "@batijs/features";
import type { UnionToIntersection, Values } from "./type-utils.js";

declare global {
  const BATI: BatiSet;
  const BATI_TEST: boolean | undefined;

  namespace NodeJS {
    interface Global {
      // Reference our above type,
      // this allows global.debug to be used anywhere in our code.
      BATI: BatiSet;
      BATI_TEST: boolean | undefined;
    }
  }

  namespace BATI {
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
