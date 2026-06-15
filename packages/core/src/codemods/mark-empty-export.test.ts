import { describe, expect, it } from "vitest";
import { BIOME_IGNORE_EMPTY_EXPORT, markEmptyExport } from "./mark-empty-export.js";

const mark = async (src: string) => (await markEmptyExport.forTarget("tsx")).transform(src, {});
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

describe("markEmptyExport", () => {
  it("annotates a bare `export {}` when the file has imports", async () => {
    const out = await mark(`import type { Foo } from "./foo";\n\nexport {};\n`);
    expect(out).toBe(`import type { Foo } from "./foo";\n\n${BIOME_IGNORE_EMPTY_EXPORT}\nexport {};\n`);
  });

  it("leaves the marker alone when the file has no imports", async () => {
    const src = `declare global {}\n\nexport {};\n`;
    expect(await mark(src)).toBe(src);
  });

  it("is idempotent — never adds a second suppression", async () => {
    const src = `import type { Foo } from "./foo";\n\nexport {};\n`;
    const once = await mark(src);
    const twice = await mark(once);
    expect(twice).toBe(once);
    expect(count(twice, /noUselessEmptyExport/g)).toBe(1);
  });

  it("ignores a non-empty export clause", async () => {
    const src = `import { Foo } from "./foo";\n\nexport { Foo };\n`;
    expect(await mark(src)).toBe(src);
  });
});
