import type { User } from "lucia";

declare global {
  namespace Vike {
    interface PageContext {
      user?: User;
    }
  }
}

export {};
