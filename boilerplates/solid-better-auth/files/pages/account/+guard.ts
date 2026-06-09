import { redirect } from "vike/abort";
import type { PageContext } from "vike/types";

// Runs on the server (and during client-side navigation). `pageContext.user` is populated by
// `betterAuthSessionMiddleware`; unauthenticated visitors are redirected to the login page.
export function guard(pageContext: PageContext) {
  if (!pageContext.user) {
    throw redirect("/login");
  }
}
