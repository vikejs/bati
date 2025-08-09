import type { Session } from "@auth/core/types";

declare global {
  namespace Vike {
    interface PageContext {
      session?: Session | null;
    }
  }
}
