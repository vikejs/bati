import type { Flags } from "@batijs/features";

declare global {
  const BATI: Set<Flags>;

  namespace NodeJS {
    interface Global {
      // Reference our above type,
      // this allows global.debug to be used anywhere in our code.
      BATI: Set<Flags>;
    }
  }
}

// By using export {}, we mark the file as an external module.
// When augmenting the global scope, you are required to make the file as a module
export {};
