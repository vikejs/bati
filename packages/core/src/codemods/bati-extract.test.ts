import { describe, expect, it } from "vitest";
import { batiExtract } from "./index.js";

const extract = async (target: Parameters<typeof batiExtract.forTarget>[0], src: string) => {
  const refs = new Set<string>();
  (await batiExtract.forTarget(target)).transform(src, { refs });
  return [...refs];
};

// A ref is "raw" — assert on the substrings `resolve` will later mine (flag literals / getter names),
// not on exact whitespace.
const mentions = (refs: string[], needle: string) => refs.some((r) => r.includes(needle));

describe("batiExtract — reference harvesting", () => {
  it("collects leading-comment directives", async () => {
    const refs = await extract("tsx", '// $$.BATI.has("sqlite") && !$$.BATI.hasD1\nconst x = 1;');
    expect(mentions(refs, 'has("sqlite")')).toBe(true);
    expect(mentions(refs, "hasD1")).toBe(true);
  });

  it("collects `$$.if` block-marker conditions", async () => {
    const refs = await extract("css", '/* $$.if($$.BATI.has("daisyui")) */\n.a {}\n/* $$.endif */');
    expect(mentions(refs, 'has("daisyui")')).toBe(true);
  });

  it("collects code-position BATI.has(...) calls and getters", async () => {
    const refs = await extract("tsx", 'if ($$.BATI.has("drizzle") && $$.BATI.hasOrm) { run(); }');
    expect(mentions(refs, 'has("drizzle")')).toBe(true);
    expect(mentions(refs, "hasOrm")).toBe(true);
  });

  it("collects `meta.BATI.has` references from $-generator code (no $$ marker)", async () => {
    const src = 'const a = props.meta.BATI.has("postgres");\nconst b = props.meta.BATI.hasD1;';
    const refs = await extract("tsx", src);
    expect(mentions(refs, 'has("postgres")')).toBe(true);
    expect(mentions(refs, "hasD1")).toBe(true);
  });

  it("collects `$$.If<>` conditional-type keys", async () => {
    const src = "type T = $$.If<{\n  '$$.BATI.has(\"kysely\") && $$.BATI.has(\"postgres\")': number;\n  _: string;\n}>;";
    const refs = await extract("tsx", src);
    expect(mentions(refs, 'has("kysely")')).toBe(true);
    expect(mentions(refs, 'has("postgres")')).toBe(true);
  });

  it("ignores code that never mentions BATI", async () => {
    expect(await extract("tsx", 'if (other) { run(); }\nconst x = obj.has("y");')).toEqual([]);
  });
});
