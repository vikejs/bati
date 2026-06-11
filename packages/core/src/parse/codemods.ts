import type { GrammarId, Transformer, ZoneSplitter } from "@codegraft/core";
import { removeUnusedImports } from "@codegraft/rules";
import { vueSplitter } from "@codegraft/vue";
import {
  batiBlocks,
  type BatiContext,
  batiCodemod,
  batiImports,
  batiYaml,
  stripLintComments,
} from "../codemods/index.js";
import type { VikeMeta } from "../types.js";

export type AllowedContextFlags = "include-if-imported";

/** The transform out-channel the build reads back: the surviving import graph and file-level flags. */
export interface FileContext {
  flags: Set<AllowedContextFlags>;
  imports: Set<string>;
}

type Target = GrammarId | ZoneSplitter;

/**
 * Run the Bati codemod pipeline over `code` for the grammar inferred from `filepath`, returning the
 * transformed source (before the whitespace tidy) and the {@link FileContext} the build reads back.
 *
 * Collapse → prune → record: `batiCodemod` resolves `$$` and drops gated imports, `stripLintComments`
 * removes unwanted eslint/biome directives, then `removeUnusedImports`, then `batiImports` records the
 * survivors — so the graph never lists an import a later pass removed. Comment-block grammars
 * (CSS/HTML, and the Vue template/style zones) first run `batiBlocks`; YAML runs `batiYaml` alone; a
 * verbatim-copy file (`null` target) passes through.
 */
export async function runCodemods(
  code: string,
  meta: VikeMeta,
  filepath: string,
): Promise<{ code: string; context: FileContext }> {
  const target = extToTarget(filepath);
  const imports = new Set<string>();
  // `meta.BATI` is a `BatiSet` (a `Set` subclass): it has `has` + the `hasX` getters the conditions
  // read, but a class can't satisfy the context's index signature — assert the (true) shape.
  const ctx: BatiContext = {
    BATI: meta.BATI as unknown as BatiContext["BATI"],
    BATI_TEST: meta.BATI_TEST,
    filename: filepath,
    imports,
  };

  let out = code;
  if (target === "yaml") {
    out = await pass(batiYaml, target, out, ctx);
  } else if (target !== null) {
    const hasCommentBlocks = target === "css" || target === "html" || target === vueSplitter;
    const hasScript = target !== "css" && target !== "html"; // JS imports to prune then record
    if (hasCommentBlocks) out = await pass(batiBlocks, target, out, ctx);
    out = await pass(batiCodemod, target, out, ctx);
    out = await pass(stripLintComments, target, out, ctx);
    if (hasScript) {
      out = await pass(removeUnusedImports, target, out, {});
      out = await pass(batiImports, target, out, ctx);
    }
  }

  return {
    code: out,
    context: { imports, flags: new Set<AllowedContextFlags>(ctx.includeIfImported ? ["include-if-imported"] : []) },
  };
}

/** The grammar (or Vue zone-splitter) a file is transformed with, or `null` for one Bati copies
 *  verbatim (`.env`, `.json`, `.md`, Dockerfile, …). */
export function extToTarget(filepath: string): Target | null {
  const lower = filepath.toLowerCase();
  if (lower.endsWith(".vue")) return vueSplitter;
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  // `tsx` is a superset of TypeScript and JavaScript, so one grammar (one WASM) covers every JS/TS
  // family file: .ts/.mts/.cts/.tsx/.d.ts and .js/.mjs/.cjs/.jsx.
  if (/\.[cm]?[tj]sx?$/.test(lower)) return "tsx";
  return null;
}

// `forTarget` loads grammar WASM once; cache the transformer per (codemod, target) and reuse it,
// keyed by codemod identity so no two passes can collide.
type Codemod<Ctx extends Record<string, unknown>> = { forTarget(target: Target): Promise<Transformer<Ctx>> };
// biome-ignore lint/suspicious/noExplicitAny: a heterogeneous transformer cache
const transformers = new Map<Codemod<any>, Map<string, Promise<Transformer<any>>>>();
async function pass<Ctx extends Record<string, unknown>>(
  codemod: Codemod<Ctx>,
  target: Target,
  source: string,
  ctx: Ctx,
): Promise<string> {
  let byTarget = transformers.get(codemod);
  if (!byTarget) {
    byTarget = new Map();
    transformers.set(codemod, byTarget);
  }
  const key = typeof target === "string" ? target : "vue";
  let transformer = byTarget.get(key);
  if (!transformer) {
    transformer = codemod.forTarget(target);
    byTarget.set(key, transformer);
  }
  return (await transformer).transform(source, ctx);
}
