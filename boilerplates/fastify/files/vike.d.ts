import type { RequestContext, ResponseContext } from "express-openid-connect";
import type { UserRecord } from "firebase-admin/auth";

//# BATI.has("auth0")
declare module "node:http" {
  interface IncomingMessage {
    oidc: RequestContext;
  }
  interface ServerResponse {
    oidc: ResponseContext;
  }
}

//# BATI.has("firebase-auth")
declare module "fastify" {
  interface FastifyRequest {
    user: UserRecord | null;
  }
}

export {};
