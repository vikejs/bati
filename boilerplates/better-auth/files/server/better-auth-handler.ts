import {
  enhance,
  type RuntimeAdapter,
  type UniversalHandler,
  type UniversalMiddleware,
} from "@universal-middleware/core";
import { betterAuth } from "better-auth";
import { getAuthConfig } from "./better-auth";

//# !BATI.hasD1
let authSingleton: ReturnType<typeof betterAuth> | undefined;

/**
 * Returns the Better Auth instance.
 * On Cloudflare the D1 binding is request-scoped, so a fresh instance is created per request;
 * everywhere else a single instance is memoized.
 */
function getAuth(runtime: RuntimeAdapter) {
  if (BATI.hasD1) {
    return betterAuth(getAuthConfig(runtime));
  } else {
    authSingleton ??= betterAuth(getAuthConfig(runtime));
    return authSingleton;
  }
}

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
/**
 * Add the Better Auth user to the context.
 * @link {@see https://better-auth.com/docs/concepts/session-management}
 */
export const betterAuthSessionMiddleware: UniversalMiddleware = enhance(
  // The context we add here is automatically merged into pageContext
  async (request, context, runtime) => {
    try {
      const data = await getAuth(runtime).api.getSession({ headers: request.headers });
      return {
        ...context,
        // Sets pageContext.user
        user: data?.user ?? null,
      };
    } catch (error) {
      console.debug("betterAuthSessionMiddleware:", error);
      return {
        ...context,
        user: null,
      };
    }
  },
  {
    name: "my-app:better-auth-middleware",
    immutable: false,
  },
);

// Note: You can directly define a server middleware instead of defining a Universal Middleware. (You can remove @universal-middleware/* — Vike's scaffolder uses it only to simplify its internal logic, see https://github.com/vikejs/vike/discussions/3116)
/**
 * Better Auth route
 * @link {@see https://better-auth.com/docs/installation}
 **/
export const betterAuthHandler = enhance(
  async (request, _context, runtime) => {
    return getAuth(runtime).handler(request);
  },
  {
    name: "my-app:better-auth-handler",
    path: "/api/auth/**",
    method: ["GET", "POST"],
    immutable: false,
  },
) satisfies UniversalHandler;
