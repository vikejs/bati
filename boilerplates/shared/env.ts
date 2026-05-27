import { appendToEnv, appliesToSink, type EnvRegistry, type EnvVarDef } from "@batijs/core";

// Renders the `.env` file from the merged registry. Lives in `shared` because it
// is the sole producer of `.env`; core owns the data model, not how each sink
// formats it.

/**
 * Render the whole `.env` from the registry. Returns `undefined` when no var
 * targets `.env`, so the caller writes no (empty) file.
 */
export function renderDotenv(registry: EnvRegistry): string | undefined {
  let content: string | undefined;
  for (const def of registry) {
    if (appliesToSink(def, "dotenv")) {
      content = appendToEnv(content, def.key, dotenvValue(def), def.comment);
    }
  }
  return content;
}

/** A secret's dev/test value (or empty), otherwise the declared default. */
function dotenvValue(def: EnvVarDef): string {
  if (def.perSink?.dotenv !== undefined) return def.perSink.dotenv;
  if (def.scope === "secret") return def.devValueFrom ? (process.env[def.devValueFrom] ?? "") : "";
  return def.default ?? "";
}
