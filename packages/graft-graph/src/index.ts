import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { toDist, walk } from "@batijs/build";
import { extractReferences } from "@batijs/core";
import { ownersOf } from "./owners.js";
import { resolveFlags } from "./resolve.js";

/** The feature-interaction graph: an undirected edge means two features jointly determine the content
 *  of some generated file — its owner(s) and the features its logic branches on. `perFile` keeps the
 *  provenance behind every interaction-bearing destination, for the matrix's "why" trace. */
export interface InteractionGraph {
  flags: string[];
  edges: [string, string][];
  perFile: Record<string, { owners: string[]; referenced: string[] }>;
}

const defaultBoilerplatesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../boilerplates");

export async function buildGraph(boilerplatesDir = defaultBoilerplatesDir): Promise<InteractionGraph> {
  const edges = new Set<string>();
  const byDest = new Map<string, { owners: Set<string>; referenced: Set<string> }>();

  for (const entry of await readdir(boilerplatesDir, { withFileTypes: true })) {
    const filesDir = join(boilerplatesDir, entry.name, "files");
    if (!entry.isDirectory() || !existsSync(filesDir)) continue;

    const owners = [...(await ownersOf(join(boilerplatesDir, entry.name)))];
    for await (const file of walk(filesDir)) {
      const referenced = new Set<string>();
      for (const ref of await extractReferences(await readFile(file, "utf8"), file)) {
        for (const flag of resolveFlags(ref)) referenced.add(flag);
      }
      // A file's logic ties its owner(s) to every feature it branches on — the interaction it encodes.
      clique(edges, [...owners, ...referenced]);
      aggregate(byDest, toDist(file, filesDir, "").replace(/^[/\\]/, ""), owners, referenced);
    }
  }

  const perFile: InteractionGraph["perFile"] = {};
  for (const [dest, flags] of byDest) {
    if (flags.owners.size + flags.referenced.size < 2) continue;
    perFile[dest] = { owners: [...flags.owners].sort(), referenced: [...flags.referenced].sort() };
  }

  const pairs = [...edges].map((e) => e.split("\t") as [string, string]).sort(compareEdges);
  return { flags: [...new Set(pairs.flat())].sort(), edges: pairs, perFile };
}

function clique(edges: Set<string>, members: string[]): void {
  const sorted = [...new Set(members)].sort();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) edges.add(`${sorted[i]}\t${sorted[j]}`);
  }
}

function aggregate(
  byDest: Map<string, { owners: Set<string>; referenced: Set<string> }>,
  dest: string,
  owners: string[],
  referenced: Set<string>,
): void {
  let acc = byDest.get(dest);
  if (!acc) {
    acc = { owners: new Set(), referenced: new Set() };
    byDest.set(dest, acc);
  }
  for (const o of owners) acc.owners.add(o);
  for (const r of referenced) acc.referenced.add(r);
}

function compareEdges(a: [string, string], b: [string, string]): number {
  return a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]);
}
