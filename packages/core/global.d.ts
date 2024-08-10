import type { Flags } from "@batijs/features";

declare global {
  const BATI: Set<Flags>;
  const BATI_TEST: boolean | undefined;

  namespace NodeJS {
    interface Global {
      // Reference our above type,
      // this allows global.debug to be used anywhere in our code.
      BATI: Set<Flags>;
      BATI_TEST: boolean | undefined;
    }
  }
}

// By using export {}, we mark the file as an external module.
// When augmenting the global scope, you are required to make the file as a module
export {};
