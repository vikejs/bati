import type { User } from "better-auth";

declare global {
  namespace Vike {
    interface PageContext {
      // Set by `betterAuthSessionMiddleware`, then passed to the client via `passToClient`.
      user?: User | null;
    }
  }
}
