import type { UserRecord } from "firebase-admin/auth";

//# BATI.has("firebase-auth")
declare module "fastify" {
  interface FastifyRequest {
    user: UserRecord | null;
  }
}

export {};
