import { describe, expect, it } from "vitest";
import { resolveFlags } from "./resolve.js";

describe("resolveFlags", () => {
  it("reads literal has(\"flag\") references", () => {
    expect(resolveFlags('$$.BATI.has("drizzle")')).toEqual(new Set(["drizzle"]));
    expect([...resolveFlags('$$.BATI.has("kysely") && $$.BATI.has("postgres")')].sort()).toEqual(["kysely", "postgres"]);
  });

  it("expands a getter to the flags it depends on", () => {
    expect([...resolveFlags("props.meta.BATI.hasD1")].sort()).toEqual(["cloudflare", "sqlite"]);
    expect(resolveFlags("$$.BATI.hasServer").has("hono")).toBe(true);
    // hasDbDemo = a database is present and not prisma → depends on the database engines and prisma.
    expect(resolveFlags("$$.BATI.hasDbDemo")).toEqual(new Set(["sqlite", "postgres", "prisma"]));
  });

  it("yields nothing for a non-feature directive", () => {
    expect(resolveFlags("$$.keepFileIfImported")).toEqual(new Set());
  });
});
