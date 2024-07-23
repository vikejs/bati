import type { UserRecord } from "firebase-admin/auth";

declare global {
  namespace Vike {
    interface PageContext {
      user?: UserRecord | null;
    }
  }
}

export {};
