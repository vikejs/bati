import type { UserRecord } from "firebase-admin/auth";

declare module "express" {
  interface Request {
    user?: UserRecord | null;
  }
}
