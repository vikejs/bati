import { removeUnusedImports } from "@codegraft/rules";
import { vueSplitter } from "@codegraft/vue";
import { describe, expect, it } from "vitest";
import { type BatiContext, batiBlocks, batiCodemod, batiImports, batiYaml } from "./index.js";

// A Bati context: enabled features + optional BATI_TEST / filename / import-graph sink.
const bati = (features: string[] = [], extra: Partial<Omit<BatiContext, "BATI">> = {}): BatiContext => ({
  BATI: { has: (f) => features.includes(f) },
  ...extra,
});

const on = (target: Parameters<typeof batiCodemod.forTarget>[0]) => batiCodemod.forTarget(target);

/** Collapse runs of whitespace to a single space and trim — for asserting structure without
 *  pinning the residual blank lines/indent the codemod leaves for the whitespace tidy. */
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

describe("bati codemod — if / else-if / else", () => {
  it("keeps the consequence when the condition is true (drops the braces)", async () => {
    const t = await on("tsx");
    const src = 'if ($$.BATI.has("a")) { X() } else { Y() }';
    expect(t.transform(src, bati(["a"]))).toBe("X()");
    expect(t.transform(src, bati())).toBe("Y()");
  });

  it("removes the whole statement when false and there is no else", async () => {
    const t = await on("tsx");
    const src = 'if ($$.BATI.has("a")) { X() }';
    expect(t.transform(src, bati(["a"]))).toBe("X()");
    expect(t.transform(src, bati())).toBe("");
  });

  it("resolves an else-if chain to the live branch", async () => {
    const t = await on("tsx");
    const src = 'if ($$.BATI.has("a")) { A() } else if ($$.BATI.has("b")) { B() } else { C() }';
    expect(t.transform(src, bati(["a"]))).toBe("A()");
    expect(t.transform(src, bati(["b"]))).toBe("B()");
    expect(t.transform(src, bati())).toBe("C()");
  });

  it("handles single-statement (braceless) if/else", async () => {
    const t = await on("tsx");
    const src = 'if ($$.BATI.has("a")) A(); else B();';
    expect(t.transform(src, bati(["a"]))).toBe("A();");
    expect(t.transform(src, bati())).toBe("B();");
  });

  it("collapses nested conditionals in one pass", async () => {
    const t = await on("tsx");
    const src = 'if ($$.BATI.has("a")) {\n  if ($$.BATI.has("b")) {\n    yes()\n  }\n}';
    expect(t.transform(src, bati(["a", "b"]))).toBe("yes()");
    expect(t.transform(src, bati(["a"]))).toBe("");
    expect(t.transform(src, bati(["b"]))).toBe("");
  });

  it("leaves a non-$$ if untouched (scan-gate + guard)", async () => {
    const t = await on("tsx");
    expect(t.transform("if (other) { a() }", bati(["a"]))).toBe("if (other) { a() }");
  });
});

describe("bati codemod — ternary", () => {
  it("collapses a plain ternary", async () => {
    const t = await on("tsx");
    const src = 'const v = $$.BATI.has("a") ? 1 : 2';
    expect(t.transform(src, bati(["a"]))).toBe("const v = 1");
    expect(t.transform(src, bati())).toBe("const v = 2");
  });

  it("collapses a nested ternary (else-if style)", async () => {
    const t = await on("tsx");
    const src = 'const v = $$.BATI.has("a") ? 1 : $$.BATI.has("b") ? 2 : 3';
    expect(t.transform(src, bati(["a"]))).toBe("const v = 1");
    expect(t.transform(src, bati(["b"]))).toBe("const v = 2");
    expect(t.transform(src, bati())).toBe("const v = 3");
  });

  it("JSX: drops the {…} braces around a kept JSX element, removes it for undefined", async () => {
    const t = await on("tsx");
    const src = 'const x = <div>{$$.BATI.has("a") ? <A /> : undefined}</div>';
    expect(t.transform(src, bati(["a"]))).toBe("const x = <div><A /></div>");
    expect(t.transform(src, bati())).toBe("const x = <div></div>");
  });

  it("JSX: keeps the braces for a non-element branch", async () => {
    const t = await on("tsx");
    const src = 'const x = <div>{$$.BATI.has("a") ? "a" : "b"}</div>';
    expect(t.transform(src, bati(["a"]))).toBe('const x = <div>{"a"}</div>');
    expect(t.transform(src, bati())).toBe('const x = <div>{"b"}</div>');
  });
});

describe("bati codemod — comment-directive gate", () => {
  it("gates the next statement / import", async () => {
    const t = await on("tsx");
    const src = '//# $$.BATI.has("a")\nimport "react"';
    expect(t.transform(src, bati(["a"]))).toBe('import "react"');
    expect(t.transform(src, bati())).toBe("");
  });

  it("accepts a plain `//` directive too ($$ is the anchor)", async () => {
    const t = await on("tsx");
    const src = '// $$.BATI.has("a")\nconst x = 1';
    expect(t.transform(src, bati(["a"]))).toBe("const x = 1");
    expect(t.transform(src, bati())).toBe("");
  });

  it("gates $$.BATI_TEST", async () => {
    const t = await on("tsx");
    const src = '//# $$.BATI_TEST\nimport "test-only"';
    expect(t.transform(src, bati([], { BATI_TEST: true }))).toBe('import "test-only"');
    expect(t.transform(src, bati([], { BATI_TEST: false }))).toBe("");
  });

  it("gates an array element and cleans the trailing comma (no array hole)", async () => {
    const t = await on("tsx");
    const src = 'const a = [\n  1,\n  //# $$.BATI.has("a")\n  two(),\n  3,\n]';
    expect(norm(t.transform(src, bati(["a"])))).toBe("const a = [ 1, two(), 3, ]");
    const off = t.transform(src, bati());
    expect(off).not.toContain("two()");
    expect(off).not.toMatch(/,\s*,/); // no `, ,` hole left behind
    expect(norm(off)).toBe("const a = [ 1, 3, ]");
  });

  it("gates an object property", async () => {
    const t = await on("tsx");
    const src = 'const a = {\n  //# $$.BATI.has("a")\n  k1: 1,\n  k2: 2,\n}';
    expect(norm(t.transform(src, bati(["a"])))).toBe("const a = { k1: 1, k2: 2, }");
    expect(norm(t.transform(src, bati()))).toBe("const a = { k2: 2, }");
  });

  it("gates call arguments incl. a spread element", async () => {
    const t = await on("tsx");
    const src = 'cfg(\n  //# $$.BATI.has("a")\n  A1,\n  //# $$.BATI.has("a")\n  ...A2,\n)';
    expect(norm(t.transform(src, bati(["a"])))).toBe("cfg( A1, ...A2, )");
    expect(norm(t.transform(src, bati()))).toBe("cfg( )");
  });

  it("gates a JSX attribute", async () => {
    const t = await on("tsx");
    const src = 'const x = <div\n  id="s"\n  //# $$.BATI.has("a")\n  class="p"\n/>';
    expect(norm(t.transform(src, bati(["a"])))).toBe('const x = <div id="s" class="p" />');
    expect(norm(t.transform(src, bati()))).toBe('const x = <div id="s" />');
  });

  it("keeps a stacked non-directive comment when the condition is true", async () => {
    const t = await on("tsx");
    const src = '//# $$.BATI.has("a")\n/// <reference types="x" />\nconst a = 1';
    expect(norm(t.transform(src, bati(["a"])))).toBe('/// <reference types="x" /> const a = 1');
    expect(t.transform(src, bati())).toBe("");
  });

  it('"remove-comments-only": strips the comments but keeps the node', async () => {
    const t = await on("tsx");
    const src = '//# $$.BATI.has("a") || "remove-comments-only"\n/// <reference types="x" />\nconst a = 1';
    expect(norm(t.transform(src, bati(["a"])))).toBe('/// <reference types="x" /> const a = 1');
    expect(norm(t.transform(src, bati()))).toBe("const a = 1");
  });
});

describe("bati codemod — whole-file suppression ($$.keepFileIf)", () => {
  it("empties the file when the condition is false, keeps it (sans directive) when true", async () => {
    const t = await on("tsx");
    const src = '// $$.keepFileIf($$.BATI.has("aws"))\nexport const handler = run()';
    expect(t.transform(src, bati(["aws"]))).toBe("export const handler = run()");
    expect(t.transform(src, bati())).toBe("");
  });

  it("supports BatiSet-property conditions and negation", async () => {
    const t = await on("typescript");
    const src = '// $$.keepFileIf(!$$.BATI.hasD1)\nimport type { Plugin } from "vite"';
    const withD1: BatiContext = { BATI: { has: () => false, hasD1: true } };
    const noD1: BatiContext = { BATI: { has: () => false, hasD1: false } };
    expect(t.transform(src, withD1)).toBe("");
    expect(t.transform(src, noD1)).toBe('import type { Plugin } from "vite"');
  });

  it("works in CSS via a block-comment directive", async () => {
    const t = await on("css");
    const src = '/* $$.keepFileIf($$.BATI.has("daisyui")) */\n.x { color: red }';
    expect(t.transform(src, bati(["daisyui"]))).toBe(".x { color: red }");
    expect(t.transform(src, bati())).toBe("");
  });
});

describe("bati codemod — TS type constructs", () => {
  it("drops `as $$.Any`", async () => {
    const t = await on("typescript");
    expect(t.transform('const a = "x" as $$.Any', bati())).toBe('const a = "x"');
    expect(t.transform("const a = (y || z) as $$.Any", bati())).toBe("const a = (y || z)");
  });

  it("resolves `$$.If` in an `as` position", async () => {
    const t = await on("typescript");
    const src = `const a = "x" as $$.If<{ '$$.BATI.has("react")': string }>`;
    expect(t.transform(src, bati(["react"]))).toBe('const a = "x" as string');
    expect(t.transform(src, bati())).toBe('const a = "x"');
  });

  it("resolves `$$.If` in a type annotation (and drops it when nothing matches)", async () => {
    const t = await on("typescript");
    const withFallback = `const a: $$.If<{ '$$.BATI.has("react")': string; _: object }> = "x"`;
    expect(t.transform(withFallback, bati(["react"]))).toBe('const a: string = "x"');
    expect(t.transform(withFallback, bati())).toBe('const a: object = "x"');

    const noFallback = `const a: $$.If<{ '$$.BATI.has("react")': string }> = "x"`;
    expect(t.transform(noFallback, bati(["react"]))).toBe('const a: string = "x"');
    expect(t.transform(noFallback, bati())).toBe('const a = "x"');
  });

  it("resolves `$$.If` in a type-argument position", async () => {
    const t = await on("typescript");
    const src = `const t = f<$$.If<{ '$$.BATI.has("react")': { env: { DB: D1 } }; _: object }>>()`;
    expect(t.transform(src, bati(["react"]))).toBe("const t = f<{ env: { DB: D1 } }>()");
    expect(t.transform(src, bati())).toBe("const t = f<object>()");
  });

  it("resolves `$$.IfAsUnknown` to `as unknown as`", async () => {
    const t = await on("typescript");
    const src = `const a = x as $$.IfAsUnknown<{ '$$.BATI.has("react")': Foo; _: Bar }>`;
    expect(t.transform(src, bati(["react"]))).toBe("const a = x as unknown as Foo");
    expect(t.transform(src, bati())).toBe("const a = x as unknown as Bar");
  });
});

describe("bati codemod — file flag + @batijs imports (ctx out-channel)", () => {
  it("records $$.includeIfImported into ctx and strips the directive", async () => {
    const t = await on("typescript");
    const ctx = bati();
    expect(t.transform("/*# $$.includeIfImported #*/\nconst a = 1", ctx)).toBe("const a = 1");
    expect(ctx.includeIfImported).toBe(true);
  });

  it("does not set the flag when absent", async () => {
    const t = await on("typescript");
    const ctx = bati();
    t.transform('const a = 1\nconst b = $$.BATI.has("x")', ctx);
    expect(ctx.includeIfImported).toBeUndefined();
  });

  it("rewrites @batijs/ imports to a relative path and records them (batiImports, no $$ needed)", async () => {
    const t = await batiImports.forTarget("typescript");
    const imports = new Set<string>();
    const ctx = bati([], { filename: "pages/todo/+Page.tsx", imports });
    const out = t.transform('import { trpc } from "@batijs/trpc/server/trpc"\nexport const x = trpc', ctx);
    expect(out).toContain('import { trpc } from "../../server/trpc"');
    expect([...imports]).toContain("../../server/trpc");
  });

  it("records plain relative imports into the graph", async () => {
    const t = await batiImports.forTarget("typescript");
    const imports = new Set<string>();
    t.transform('import { a } from "./local"\nuse(a)', bati([], { filename: "x.ts", imports }));
    expect([...imports]).toContain("./local");
  });

  it("a @batijs import removed by a false condition is not recorded (run after batiCodemod)", async () => {
    const collapse = await on("tsx");
    const rewrite = await batiImports.forTarget("tsx");
    const imports = new Set<string>();
    const ctx = bati([], { filename: "x.ts", imports });
    const src = '//# $$.BATI.has("react")\nimport "@batijs/shared/server/load"\nexport const x = 1';
    const out = rewrite.transform(collapse.transform(src, ctx), ctx);
    expect(out).not.toContain("server/load");
    expect([...imports]).not.toContain("./server/load");
  });
});

describe("batiBlocks — comment-delimited if/elif/else/endif (CSS)", () => {
  const css = (features: string[] = []) =>
    batiBlocks.forTarget("css").then((t) => (src: string) => t.transform(src, bati(features)));

  it("keeps the live branch of an if/else block, drops markers + dead branch", async () => {
    const run = await css(["daisyui"]);
    const src =
      '/* $$.if($$.BATI.has("daisyui")) */\n@plugin "daisyui";\n/* $$.else */\n@import "./base.css";\n/* $$.endif */\n';
    expect(norm(run(src))).toBe('@plugin "daisyui";');
    const runOff = await css([]);
    expect(norm(runOff(src))).toBe('@import "./base.css";');
  });

  it("handles an if with no else (keep vs drop the body)", async () => {
    const on = await css(["d"]);
    const off = await css([]);
    const src = 'a { x: 1 }\n/* $$.if($$.BATI.has("d")) */\n.feature { y: 2 }\n/* $$.endif */\nb { z: 3 }\n';
    expect(norm(on(src))).toBe("a { x: 1 } .feature { y: 2 } b { z: 3 }");
    expect(norm(off(src))).toBe("a { x: 1 } b { z: 3 }");
  });

  it("resolves an elif chain", async () => {
    const src =
      '/* $$.if($$.BATI.has("a")) */\n.a {}\n/* $$.elif($$.BATI.has("b")) */\n.b {}\n/* $$.else */\n.c {}\n/* $$.endif */\n';
    expect(norm((await css(["a"]))(src))).toBe(".a {}");
    expect(norm((await css(["b"]))(src))).toBe(".b {}");
    expect(norm((await css([]))(src))).toBe(".c {}");
  });

  it("collapses same-container nested blocks (only the live branch is descended)", async () => {
    const src = [
      '/* $$.if($$.BATI.has("outer")) */',
      ".outer {}",
      '/* $$.if($$.BATI.has("inner")) */',
      ".inner {}",
      "/* $$.endif */",
      "/* $$.else */",
      ".alt {}",
      "/* $$.endif */",
      "",
    ].join("\n");
    expect(norm((await css(["outer", "inner"]))(src))).toBe(".outer {} .inner {}");
    expect(norm((await css(["outer"]))(src))).toBe(".outer {}");
    expect(norm((await css([]))(src))).toBe(".alt {}");
  });
});

describe("bati codemod — Vue SFC (multi-zone)", () => {
  it("transforms only the <script> zone", async () => {
    const t = await on(vueSplitter);
    const sfc = [
      "<template>",
      "  <h1>{{ title }}</h1>",
      "</template>",
      "",
      '<script setup lang="ts">',
      'const title = "App"',
      'if ($$.BATI.has("auth")) {',
      "  useAuth()",
      "} else {",
      "  useGuest()",
      "}",
      "</script>",
    ].join("\n");
    const on1 = t.transform(sfc, bati(["auth"]));
    expect(on1).toContain("useAuth()");
    expect(on1).not.toContain("useGuest()");
    expect(on1).not.toContain("$$");
    expect(on1).toContain("<h1>{{ title }}</h1>"); // template untouched

    const off = t.transform(sfc, bati());
    expect(off).toContain("useGuest()");
    expect(off).not.toContain("useAuth()");
  });
});

describe("batiYaml — # $$.BATI… line gating (clean output, no residual blank lines)", () => {
  const yaml = async (ctx: BatiContext, src: string) => (await batiYaml.forTarget("yaml")).transform(src, ctx);

  it("drops a sequence item when false, keeps it when true", async () => {
    const src = 'environment:\n  - NODE_ENV=production\n  # $$.BATI.has("authjs")\n  - AUTH_SECRET=x\n';
    expect(await yaml(bati(["authjs"]), src)).toBe("environment:\n  - NODE_ENV=production\n  - AUTH_SECRET=x\n");
    expect(await yaml(bati(), src)).toBe("environment:\n  - NODE_ENV=production\n");
  });

  it("drops a mapping pair (and its nested block)", async () => {
    const src = 'app:\n  build: .\n  # $$.BATI.has("sqlite")\n  volumes:\n    - sqlite_data:/data\n  restart: always\n';
    expect(await yaml(bati(["sqlite"]), src)).toBe(
      "app:\n  build: .\n  volumes:\n    - sqlite_data:/data\n  restart: always\n",
    );
    expect(await yaml(bati(), src)).toBe("app:\n  build: .\n  restart: always\n");
  });

  it("drops a top-level pair at column 0, eating the blank-line separator (indentation quirk)", async () => {
    const src = 'services:\n  app:\n    restart: always\n\n# $$.BATI.has("sqlite")\nvolumes:\n  sqlite_data:\n';
    expect(await yaml(bati(["sqlite"]), src)).toBe(
      "services:\n  app:\n    restart: always\n\nvolumes:\n  sqlite_data:\n",
    );
    expect(await yaml(bati(), src)).toBe("services:\n  app:\n    restart: always\n");
  });

  it("drops the first entry of a mapping (hoisted comment)", async () => {
    const src = 'volumes:\n  # $$.BATI.has("authjs")\n  first: {}\n  second: {}\n';
    expect(await yaml(bati(["authjs"]), src)).toBe("volumes:\n  first: {}\n  second: {}\n");
    expect(await yaml(bati(), src)).toBe("volumes:\n  second: {}\n");
  });

  it("keeps a non-directive comment when true, drops it with the node when false", async () => {
    const src = 'env:\n  - A=1\n  # regular comment\n  # $$.BATI.has("authjs")\n  - B=2\n';
    expect(await yaml(bati(["authjs"]), src)).toBe("env:\n  - A=1\n  # regular comment\n  - B=2\n");
    expect(await yaml(bati(), src)).toBe("env:\n  - A=1\n");
  });

  it("evaluates BatiSet-property + compound conditions", async () => {
    const ctx: BatiContext = { BATI: { has: (f: string) => f === "sqlite", hasDatabase: true } };
    const src =
      'app:\n  build: .\n  # $$.BATI.hasDatabase && !$$.BATI.has("postgres")\n  volumes:\n    - x\n  restart: y\n';
    expect(await yaml(ctx, src)).toBe("app:\n  build: .\n  volumes:\n    - x\n  restart: y\n");
    const noDb: BatiContext = { BATI: { has: () => false, hasDatabase: false } };
    expect(await yaml(noDb, src)).toBe("app:\n  build: .\n  restart: y\n");
  });
});

describe("bati codemod + removeUnusedImports (the post-pass companion)", () => {
  it("collapses, then drops the now-unused import", async () => {
    const collapse = await on("typescript");
    const prune = await removeUnusedImports.forTarget("typescript");
    const src = [
      'import { solid } from "solid"',
      'import react from "react"',
      'export const framework = $$.BATI.has("react") ? react() : $$.BATI.has("solid") ? solid() : null',
    ].join("\n");
    expect(norm(prune.transform(collapse.transform(src, bati(["react"])), {}))).toBe(
      'import react from "react" export const framework = react()',
    );
    expect(norm(prune.transform(collapse.transform(src, bati(["solid"])), {}))).toBe(
      'import { solid } from "solid" export const framework = solid()',
    );
    expect(norm(prune.transform(collapse.transform(src, bati()), {}))).toBe("export const framework = null");
  });
});
