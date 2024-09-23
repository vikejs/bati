import type { UserRecord } from "firebase-admin/auth";

//# BATI.has("firebase-auth")
declare module "h3" {
  interface H3EventContext {
    user: UserRecord | null;
  }
}

export {};
