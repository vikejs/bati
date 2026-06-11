import { describe, expect, it } from "vitest";
import { mergeDts } from "./merge-dts.js";

const merge = async (...files: string[]) => (await mergeDts.forTarget("typescript")).transform(files.join("\n"), {});
const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

const dts = (members: string, iface = "PageContext") =>
  `declare global {\n  namespace Vike {\n    interface ${iface} {\n${members}\n    }\n  }\n}\n`;

describe("mergeDts", () => {
  it("unions members of the same interface into one declaration chain", async () => {
    const out = await merge(dts("      user?: User"), dts("      session?: Session"));
    expect(count(out, /declare global/g)).toBe(1);
    expect(count(out, /namespace Vike/g)).toBe(1);
    expect(count(out, /interface PageContext/g)).toBe(1);
    expect(out).toContain("user?: User");
    expect(out).toContain("session?: Session");
  });

  it("merges different interfaces under one shared namespace", async () => {
    const out = await merge(dts("      a: A", "PageContext"), dts("      b: B", "PageContextServer"));
    expect(count(out, /declare global/g)).toBe(1);
    expect(count(out, /namespace Vike/g)).toBe(1);
    expect(out).toContain("interface PageContext");
    expect(out).toContain("interface PageContextServer");
  });

  it("dedupes an identical member", async () => {
    const out = await merge(dts("      env: Env", "PageContextServer"), dts("      env: Env", "PageContextServer"));
    expect(count(out, /env: Env/g)).toBe(1);
    expect(count(out, /interface PageContextServer/g)).toBe(1);
  });

  it("dedupes imports and `export {}`, keeping distinct imports", async () => {
    const a = `import type { User } from "better-auth";\n${dts("      user?: User")}\nexport {};\n`;
    const b = `import type { User } from "better-auth";\nimport type { Session } from "@auth/core/types";\n${dts("      session?: Session")}\nexport {};\n`;
    const out = await merge(a, b);
    expect(count(out, /import type \{ User \} from "better-auth"/g)).toBe(1);
    expect(out).toContain('import type { Session } from "@auth/core/types"');
    expect(count(out, /export \{\}/g)).toBe(1);
  });

  it("merges `declare module` blocks by their module name", async () => {
    const mod = (m: string) =>
      `declare module "telefunc" {\n  namespace Telefunc {\n    interface Context {\n${m}\n    }\n  }\n}\n`;
    const out = await merge(mod("      a: A"), mod("      b: B"));
    expect(count(out, /declare module "telefunc"/g)).toBe(1);
    expect(count(out, /namespace Telefunc/g)).toBe(1);
    expect(out).toContain("a: A");
    expect(out).toContain("b: B");
  });

  it("preserves a member leading comment", async () => {
    const a = dts("      first: A");
    const b = dts("      // set by middleware\n      user?: User");
    const out = await merge(a, b);
    expect(out).toContain("// set by middleware");
    expect(out).toContain("user?: User");
  });

  it("leaves a single file untouched (modulo formatting)", async () => {
    const a = dts("      user?: User");
    expect(norm(await merge(a))).toBe(norm(a));
  });
});
