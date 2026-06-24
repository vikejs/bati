// Test-semantics metadata the generator can't infer from the graph. Kept here (not on the public
// `Feature` type) because it is about how we verify a feature, not about the feature itself.

/** Flags whose combos run only when their credentials are present (CI provides them). The generator
 *  drops a value from its axis when the env var is unset, mirroring the hand-written matrix. */
export const requiresEnv: Record<string, readonly string[]> = {
  auth0: ["TEST_AUTH0_CLIENT_ID"],
};

export function envAvailable(flag: string): boolean {
  return (requiresEnv[flag] ?? []).every((name) => Boolean(process.env[name]));
}
