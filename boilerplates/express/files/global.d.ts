import type { UserRecord } from "firebase-admin/auth";

//# BATI.has("firebase-auth")
declare module "express" {
  interface Request {
    user?: UserRecord | null;
  }
}

export {};
