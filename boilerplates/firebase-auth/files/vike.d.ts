import type { UserRecord } from "firebase-admin/auth";

declare global {
  // eslint-disable-next-line
  namespace Vike {
    interface PageContext {
      user?: UserRecord | null;
    }
  }
}

export {};
