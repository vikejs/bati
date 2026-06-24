import { describe, expect, it } from "vitest";
import { buildGraph } from "./index.js";

describe("buildGraph", () => {
  const graph = buildGraph();
  const edge = (g: Awaited<typeof graph>, a: string, b: string) =>
    g.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  it("connects features that jointly determine a file", async () => {
    const g = await graph;
    // drizzle's templates branch on the engine and on Cloudflare/D1.
    expect(edge(g, "drizzle", "sqlite")).toBe(true);
    expect(edge(g, "drizzle", "postgres")).toBe(true);
    expect(edge(g, "drizzle", "cloudflare")).toBe(true);
    // a data layer wires into the server.
    expect(edge(g, "telefunc", "hono")).toBe(true);
  });

  it("is deterministic and canonical", async () => {
    const g = await graph;
    expect(g.edges).toEqual([...g.edges].sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]))));
    for (const [a, b] of g.edges) expect(a < b).toBe(true); // each pair stored low→high
  });
});
