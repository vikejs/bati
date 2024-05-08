import type { UserRecord } from "firebase-admin/auth";

//# BATI.has("firebase-auth")
declare module "hono" {
  interface ContextVariableMap {
    user?: UserRecord | null;
  }
}

export {};
