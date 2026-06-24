import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { BatiConfig } from "@batijs/core/config";
import { resolveFlags } from "./resolve.js";

/**
 * The flags whose selection pulls a boilerplate into a scaffold — the features its `bati.config.ts`
 * `if` predicate tests, read straight off the predicate's source (so any conjunction arity works, e.g.
 * D1 + Kysely). Base boilerplates (no `if`) have none.
 */
export async function ownersOf(boilerplateDir: string): Promise<Set<string>> {
  const config: BatiConfig = (await import(pathToFileURL(join(boilerplateDir, "bati.config.ts")).href)).default;
  if (!config.if) return new Set();

  const source = config.if.toString();
  const owners = resolveFlags(source);
  if (source.includes("BATI") && owners.size === 0) {
    throw new Error(`bati.config.ts if() reads BATI but resolved no flag: ${boilerplateDir}`);
  }
  return owners;
}
