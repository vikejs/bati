import { appendToEnv, type EnvRegistry, envVarApplies, type EnvVarDef, type VikeMeta } from "@batijs/core";

// Renders the `.env` file from the merged env registry. Lives here because the
// `shared` boilerplate is the sole producer of `.env`; core owns only the data
// model, not how each sink formats it.

/** Value written to `.env` for a given declaration. */
function dotenvValue(def: EnvVarDef): string {
  if (def.perSink?.dotenv !== undefined) return def.perSink.dotenv;
  if (def.scope === "secret") {
    return def.devValueFrom ? (process.env[def.devValueFrom] ?? "") : "";
  }
  return def.default ?? "";
}

/**
 * Render the whole `.env` from the registry, reusing `appendToEnv` for
 * formatting. Returns `undefined` when no var targets `.env`, so the caller can
 * skip writing an empty file.
 */
export function renderDotenv(registry: EnvRegistry | undefined, meta: VikeMeta): string | undefined {
  if (!registry || registry.length === 0) return undefined;

  let content: string | undefined;
  let emitted = false;

  for (const def of registry) {
    if (!envVarApplies(def, meta, "dotenv")) continue;
    content = appendToEnv(content, def.key, dotenvValue(def), def.comment);
    emitted = true;
  }

  return emitted ? content : undefined;
}
