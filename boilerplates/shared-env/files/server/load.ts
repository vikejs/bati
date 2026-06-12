/* $$.keepFileIfImported */
import { readFileSync } from "node:fs";
import process from "node:process";
import { parseEnv } from "node:util";

/**
 * Load a `.env` file into `process.env` using the runtime's native facilities — the dependency-free
 * replacement for `dotenv/config`. Like dotenv (and `--env-file`), it does not override variables
 * that are already set, so the ambient environment (shell / CI) keeps precedence.
 *
 * - Node / Deno: `process.loadEnvFile()` (native, since Node 20.12).
 * - Bun: lacks `process.loadEnvFile` but auto-loads `.env` already; the `parseEnv` fallback then
 *   only fills in anything still missing.
 */
export function loadEnv(file = ".env"): void {
  try {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(file);
    } else {
      for (const [key, value] of Object.entries(parseEnv(readFileSync(file, "utf8")))) {
        process.env[key] ??= value;
      }
    }
  } catch {
    // `.env` is optional — fall back to the ambient environment.
  }
}

loadEnv();
