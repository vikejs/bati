import { committedValue, type EnvRegistry, type EnvVarDef, secretDevValue, type VikeMeta } from "@batijs/core";

// Renders the `.env` file from the merged registry. Lives in `shared` because it
// is the sole producer of `.env`; core owns the data model, not how each sink
// formats it. `.env` holds public vars plus — unless a platform manages them
// (see `hasDotEnvSecrets`) — the server-runtime secrets/defaults.

/**
 * Render the whole `.env` from the registry. Returns `undefined` when no var
 * targets `.env`, so the caller writes no (empty) file.
 */
export function renderDotenv(registry: EnvRegistry, meta: VikeMeta): string | undefined {
  let content: string | undefined;
  for (const def of registry) {
    if (def.scope !== "public" && !meta.BATI.hasDotEnvSecrets) continue;
    content = appendEntry(content, def.key, dotenvValue(def), def.comment);
  }
  return content;
}

function dotenvValue(def: EnvVarDef): string {
  return def.scope === "secret" ? secretDevValue(def) : committedValue(def, "dotenv");
}

// Appends `KEY=value` (with its `#`-prefixed comment) and a blank line between
// entries. Values are quoted unless empty.
function appendEntry(content: string | undefined, key: string, value: string, comment?: string): string {
  const blank = content ? "\n" : "";
  const comments = comment ? `${comment.replace(/^(.+)/gm, "# $1")}\n` : "";
  return `${content ?? ""}${blank}${comments}${key}=${value ? JSON.stringify(value) : ""}\n`;
}
