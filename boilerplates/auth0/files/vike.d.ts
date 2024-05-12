import type { RequestContext } from "express-openid-connect";

declare global {
  namespace Vike {
    interface PageContext {
      user?: RequestContext["user"] | null;
    }
  }
}

export {};
