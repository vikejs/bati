/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
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

    type If<T extends Partial<Record<string, any>>> = UnionToIntersection<Values<T>>;
    type IfAsUnkown<T extends Partial<Record<string, any>>> = If<T>;
  }
}

// By using export {}, we mark the file as an external module.
// When augmenting the global scope, you are required to make the file as a module
export {};
