import { categories, features } from "@batijs/features";
import type { InteractionGraph } from "./index.js";

const categoryOf = new Map<string, string>(features.map((f) => [f.flag, f.category]));

/** Adjacency list for the terminal. */
export function toText(graph: InteractionGraph): string {
  const neighbors = new Map(graph.flags.map((f) => [f, [] as string[]]));
  for (const [a, b] of graph.edges) {
    neighbors.get(a)!.push(b);
    neighbors.get(b)!.push(a);
  }
  const lines = [`${graph.flags.length} flags, ${graph.edges.length} edges`, ""];
  for (const f of graph.flags) lines.push(`${f}: ${neighbors.get(f)!.sort().join(", ")}`);
  return `${lines.join("\n")}\n`;
}

export function toJson(graph: InteractionGraph): string {
  return `${JSON.stringify(graph, null, 2)}\n`;
}

/** Graphviz source, nodes boxed by category so the SVG shows which axes interact. */
export function toDot(graph: InteractionGraph): string {
  const byCategory = new Map<string, string[]>();
  for (const f of graph.flags) {
    const category = categoryOf.get(f)!;
    let members = byCategory.get(category);
    if (!members) {
      members = [];
      byCategory.set(category, members);
    }
    members.push(f);
  }

  const lines = ["graph interactions {", "  node [shape=box, style=rounded];"];
  for (const { label } of categories) {
    const members = byCategory.get(label);
    if (!members) continue;
    lines.push(`  subgraph "cluster_${label}" {`, `    label="${label}";`);
    for (const f of members.sort()) lines.push(`    "${f}";`);
    lines.push("  }");
  }
  for (const [a, b] of graph.edges) lines.push(`  "${a}" -- "${b}";`);
  lines.push("}");
  return `${lines.join("\n")}\n`;
}

export async function toSvg(graph: InteractionGraph): Promise<string> {
  const { instance } = await import("@viz-js/viz");
  const viz = await instance();
  return viz.renderString(toDot(graph), { format: "svg" });
}
