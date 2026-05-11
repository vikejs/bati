# Plan: Replace ESLint Transformer with ast-grep

## Goals

1. **Limit CLI size** — the current `packages/core/dist/index.js` is 8.7 MB because the entire ESLint ecosystem is bundled via `alwaysBundle: [/./]` in tsdown. Replacing with `@ast-grep/napi` (a native binary, cannot be bundled) will shrink the JS bundle to ~1–2 MB.
2. **Less complexity** — ESLint is abused as a code transformer (not a linter). The "report violation → apply fixer" indirection, `verifyAndFix` multi-pass loop, `eslintFixPlugin` build hack, and `eslint-rule-composer` composition hack are all removed.

## What Stays Unchanged

| File | Reason |
|---|---|
| `parse/eval.ts` | `evalCondition()` via `new Function()` is kept exactly as-is |
| `parse/squirelly.ts` | Already handles CSS/arbitrary files; unrelated to ESLint |
| `parse.ts` | Orchestrator; only its `import` of `transform` changes |
| `format.ts` | Prettier formatting; unchanged |
| `parse/linters/common.ts` → `Extractor` + `FileContext` | Pure data structures, reused directly |

## Dependencies

### Remove from `devDependencies` in `packages/core/package.json`

```
eslint
@typescript-eslint/parser
@typescript-eslint/utils
@typescript-eslint/eslint-plugin   (pulled in via plugin-remove-unused-imports.ts)
vue-eslint-parser
eslint-plugin-solid
eslint-rule-composer
@types/eslint
@types/estree
espree                              (if only used via ESLint)
```

### Add to `dependencies` in `packages/core/package.json`

```
@ast-grep/napi     ^0.42.1
```

It must be a runtime `dependency` (not `devDependency`) because it is a native binary that cannot be bundled.

## Build Config Changes (`packages/core/tsdown.config.ts`)

1. Delete `eslintFixPlugin` entirely (no longer needed without ESLint).
2. Add `neverBundle: [/@ast-grep\//]` to the `src/index.ts` bundle entry — native modules cannot be inlined by rolldown.

```ts
// Before
plugins: [eslintFixPlugin, purgePolyfills.rolldown({})],
deps: {
  alwaysBundle: [/./],
  onlyBundle: false,
},

// After
plugins: [purgePolyfills.rolldown({})],
deps: {
  alwaysBundle: [/./],
  neverBundle: [/@ast-grep\//],
  onlyBundle: false,
},
```

## New File Structure

```
packages/core/src/parse/
  ast-grep/
    index.ts                  ← replaces linters/index.ts (same export shape)
    lang.ts                   ← filename → Lang enum
    apply-edits.ts            ← collect & apply TextEdits in reverse-position order
    transform-ts.ts           ← .ts/.js/.tsx/.jsx transformations (multi-pass)
    transform-vue.ts          ← .vue SFC via Lang.Html + manual script re-parse
    remove-unused-imports.ts  ← post-transform import cleanup
  eval.ts                     ← UNCHANGED
  squirelly.ts                ← UNCHANGED
  linters/
    common.ts                 ← keep (Extractor class + FileContext interface)
    index.ts                  ← becomes a 1-line re-export shim for test compat
    [all other files]         ← deleted after tests pass
```

## `lang.ts`

```ts
import { Lang } from "@ast-grep/napi";

export function getLang(filename: string): Lang | null {
  if (filename.endsWith(".ts"))  return Lang.TypeScript;
  if (filename.endsWith(".js"))  return Lang.TypeScript;
  if (filename.endsWith(".tsx")) return Lang.Tsx;
  if (filename.endsWith(".jsx")) return Lang.Tsx;
  return null; // .vue handled separately; .css never reaches here
}
```

## `apply-edits.ts`

```ts
export interface TextEdit {
  startIndex: number; // inclusive byte offset
  endIndex: number;   // exclusive byte offset
  newText: string;
}

export function applyEdits(code: string, edits: TextEdit[]): string {
  // Deduplicate: if two edits overlap, keep the one with the smaller startIndex
  // (outer wins over inner, which is what we want for nested if-statements).
  const deduped = deduplicateEdits(edits);
  // Apply in reverse position order so earlier offsets are not shifted.
  const sorted = deduped.sort((a, b) => b.startIndex - a.startIndex);
  let result = code;
  for (const edit of sorted) {
    result = result.slice(0, edit.startIndex) + edit.newText + result.slice(edit.endIndex);
  }
  return result;
}
```

## `transform-ts.ts` — Transformation Logic

Takes `(code, lang, filename, meta, extractor)`, returns transformed code string.

Uses a **multi-pass loop** (like ESLint's `verifyAndFix`) to handle nested patterns:

```ts
export function transformTs(code, lang, filename, meta, extractor): string {
  let current = code;
  for (let pass = 0; pass < 10; pass++) {
    const next = runOnePass(current, lang, filename, meta, extractor);
    if (next === current) break;
    current = next;
  }
  return current;
}
```

Each pass calls `parse(lang, code).root()` and collects edits for:

### A. If/else statements (`if_statement` nodes)

```ts
for (const node of root.findAll({ rule: { kind: "if_statement" } })) {
  const cond = node.field("condition");
  if (!hasBatiCondition(cond.text())) continue;

  const testVal = evalCondition(cond.text(), meta);
  const consequent = node.field("consequence");   // always present
  const alternate  = node.field("alternative");   // may be null

  if (testVal) {
    edits.push(replaceWithBlockBody(node, consequent));
  } else if (alternate) {
    edits.push(replaceWithBlockBody(node, alternate));
  } else {
    edits.push(removeNode(node));
  }
}
```

`replaceWithBlockBody` strips the `{` `}` braces when the branch is a `statement_block`.

### B. Ternary conditionals (`ternary_expression` nodes)

```ts
for (const node of root.findAll({ rule: { kind: "ternary_expression" } })) {
  const cond = node.field("condition");
  if (!hasBatiCondition(cond.text())) continue;

  const testVal = evalCondition(cond.text(), meta);
  const chosen = testVal ? node.field("consequence") : node.field("alternative");

  // JSX container unwrap: {<Comp/>} → <Comp/> (no braces)
  const edit = resolveJsxContainerEdit(node, chosen);
  edits.push(edit);
}
```

### C. Comment-based conditions (`//# BATI.has(...)` before a statement)

Comments are first-class nodes in tree-sitter (kind `"comment"`).

```ts
for (const commentNode of root.findAll({ rule: { kind: "comment" } })) {
  const raw = commentNode.text(); // e.g. "//# BATI.has("react")"
  const condition = extractBatiConditionComment({ value: raw.slice(2) });
  if (!condition) continue;

  // Collect consecutive comment siblings (for multi-comment remove-comments-only case)
  const allLeading = collectConsecutiveCommentSiblings(commentNode);
  const targetNode = allLeading.at(-1)!.next(); // next non-comment sibling

  const testVal = evalCondition(condition, meta);
  const removeCommentsOnly = allLeading.length > 1 && testVal === "remove-comments-only";

  if (!testVal || testVal === "remove-comments-only") {
    for (const c of allLeading) edits.push(removeNodeWithNewline(c));
    if (!removeCommentsOnly && targetNode) edits.push(removeNodeWithTrailing(targetNode, code));
  } else {
    // Condition true: only remove the BATI condition comment
    edits.push(removeNodeWithNewline(commentNode));
  }
}
```

`collectConsecutiveCommentSiblings` follows `.next()` while the sibling `kind() === "comment"`.

**JSX attributes** — in the `tsx` grammar, JSX attribute comment siblings work identically. The target node is a `jsx_attribute`. Same algorithm, no special case needed.

### D. Global file comment (`/*# BATI include-if-imported #*/`)

```ts
const firstComment = root.findAll({ rule: { kind: "comment" } })
  .find(n => n.range().start.index === 0);

if (firstComment) {
  const flags = extractBatiGlobalComment({ value: firstComment.text().slice(2, -2) });
  if (flags) {
    for (const flag of flags) extractor.addFlag(flag); // throws on unknown flag
    edits.push(removeNodeWithNewline(firstComment));
  }
}
```

### E. Import rewrites (`@batijs/…` → relative path)

```ts
for (const node of root.findAll({ rule: { kind: "import_statement" } })) {
  const src = node.field("source");
  const path = src.text().slice(1, -1); // strip quotes
  const match = getBatiImportMatch(path);
  if (match) {
    const newPath = relative(filename, match[1]);
    extractor.addImport(newPath);
    edits.push({ startIndex: src.range().start.index + 1,
                 endIndex:   src.range().end.index   - 1,
                 newText:    newPath });
  } else if (path.startsWith("./") || path.startsWith("../")) {
    extractor.addImport(path);
  }
}
```

### F. TypeScript type — `BATI.Any`

```ts
// expr as BATI.Any  →  expr
for (const node of root.findAll({ rule: { kind: "as_expression" } })) {
  const typeNode = node.field("type");
  if (isQualifiedName(typeNode, "BATI", "Any")) {
    // Remove " as BATI.Any"
    edits.push({ startIndex: node.field("value").range().end.index,
                 endIndex:   node.range().end.index,
                 newText:    "" });
  }
}
```

### G. TypeScript type — `BATI.If<{…}>` and `BATI.IfAsUnknown<{…}>`

Walk `generic_type` nodes where the name is `BATI.If` or `BATI.IfAsUnknown`. Iterate over `object_type` property signatures, evaluate each key as a BATI condition, pick the first match (or `_` fallback). Replace the type reference with the chosen type string. Mirrors `visitor-ts-types.ts:transformBatiType()` 1-to-1.

## `transform-vue.ts` — Vue SFC Strategy

```ts
export function transformVue(code, filename, meta, extractor): string {
  // 1. Parse the whole .vue file as HTML
  const root = parse(Lang.Html, code).root();
  const edits: TextEdit[] = [];

  // 2. Transform <script> section
  const scriptEl = root.find({ rule: { kind: "script_element" } });
  if (scriptEl) {
    const rawText = scriptEl.find({ rule: { kind: "raw_text" } });
    if (rawText) {
      const scriptContent = rawText.text();
      const scriptOffset  = rawText.range().start.index;
      const lang = hasLangTs(scriptEl) ? Lang.TypeScript : Lang.TypeScript;
      const transformed = transformTs(scriptContent, lang, filename, meta, extractor);
      edits.push({
        startIndex: scriptOffset,
        endIndex:   scriptOffset + scriptContent.length,
        newText:    transformed,
      });
    }
  }

  // 3. Transform <template> section — HTML comments before elements
  const templateEl = root.find({ rule: { kind: "element",
    has: { rule: { kind: "start_tag",
      has: { rule: { kind: "tag_name", regex: "^template$" } } } } } });
  if (templateEl) {
    collectVueTemplateEdits(templateEl, code, meta, edits);
  }

  // 4. <style> already handled by squirelly before this runs — no action

  return applyEdits(code, edits);
}
```

### Vue template HTML comments

```ts
function collectVueTemplateEdits(templateEl, code, meta, edits) {
  for (const commentNode of templateEl.findAll({ rule: { kind: "comment" } })) {
    // HTML comment text: "<!-- BATI.has("vue") -->"
    const raw = commentNode.text();
    const condition = extractBatiConditionComment({ value: raw.slice(4, -3) }); // strip <!-- -->
    if (!condition) continue;

    const testVal = evalCondition(condition, meta);
    const nextEl = commentNode.next(); // next sibling in HTML AST

    if (!testVal) {
      edits.push(removeNodeWithNewline(commentNode));
      if (nextEl) edits.push(removeNodeWithNewline(nextEl));
    } else {
      edits.push(removeNodeWithNewline(commentNode)); // keep element, remove comment
    }
  }
}
```

Replaces `getAllCommentsBefore` + `VElement` visitor from `linter-vue.ts` entirely.

Vue script ternary conditionals (`{{ BATI.has("vue") ? "a" : "b" }}`) are handled automatically because the script content is re-parsed with `Lang.TypeScript` and goes through `transformTs`.

## `remove-unused-imports.ts`

Runs **after** `transformTs`/`transformVue` on the already-transformed code.

```ts
export function removeUnusedImports(code, lang, extractor): string {
  const root = parse(lang, code).root();
  const edits: TextEdit[] = [];

  for (const importNode of root.findAll({ rule: { kind: "import_statement" } })) {
    const source = importNode.field("source").text().slice(1, -1);
    const specifiers = collectSpecifiers(importNode); // { name, specifierNode }[]

    for (const { name, specifierNode } of specifiers) {
      // Count usages outside the import declaration itself
      const usages = root.findAll({ rule: { pattern: name, kind: "identifier" } })
        .filter(n => !isAncestor(importNode, n));

      if (usages.length === 0) {
        if (specifiers.length === 1) {
          // Remove entire import statement
          extractor.deleteImport(source);
          edits.push(removeNodeWithNewline(importNode));
        } else {
          // Remove just this specifier (+ surrounding comma)
          edits.push(removeSpecifier(specifierNode, importNode, code, root));
        }
      }
    }
  }

  return applyEdits(code, edits);
}
```

Replaces `plugin-remove-unused-imports.ts` and its `eslint-rule-composer` hack.

## `ast-grep/index.ts` — Entry Point

```ts
import { getLang } from "./lang.js";
import { transformTs } from "./transform-ts.js";
import { transformVue } from "./transform-vue.js";
import { removeUnusedImports } from "./remove-unused-imports.js";
import { Extractor } from "../linters/common.js";
import type { VikeMeta } from "../../types.js";

export function transform(code: string, filename: string, meta: VikeMeta) {
  const extractor = new Extractor(filename);
  let transformed: string;

  if (filename.endsWith(".vue")) {
    transformed = transformVue(code, filename, meta, extractor);
  } else {
    const lang = getLang(filename);
    if (lang) {
      transformed = transformTs(code, lang, filename, meta, extractor);
      transformed = removeUnusedImports(transformed, lang, extractor);
    } else {
      transformed = code;
    }
  }

  return { code: transformed, context: extractor };
}
```

## Backward-Compat Shim

Both test files import from `"../src/parse/linters/index.js"`. Keep that file as a thin re-export:

```ts
// packages/core/src/parse/linters/index.ts  (replaces current content)
export { transform } from "../ast-grep/index.js";
```

`parse.ts` already imports `transform` from `./parse/linters/index.js` — no change needed there either, or optionally update it to import from `./parse/ast-grep/index.js` directly.

## Files Deleted After Tests Pass

```
packages/core/src/parse/linters/linter-ts.ts
packages/core/src/parse/linters/linter-vue.ts
packages/core/src/parse/linters/visit-if-statement.ts
packages/core/src/parse/linters/visitor-statement-with-comments.ts
packages/core/src/parse/linters/visitor-imports.ts
packages/core/src/parse/linters/visitor-ts-types.ts
packages/core/src/parse/linters/visitor-global-comments.ts
packages/core/src/parse/linters/plugin-remove-unused-imports.ts
packages/core/src/parse/linters/types.ts
```

`packages/core/src/parse/linters/common.ts` is **kept** (Extractor + FileContext used by both the new code and the public API).

## Implementation Order

1. `pnpm add @ast-grep/napi --filter @batijs/core` (adds to dependencies)
2. Update `tsdown.config.ts` — remove `eslintFixPlugin`, add `neverBundle: [/@ast-grep\//]`
3. Create `parse/ast-grep/lang.ts`
4. Create `parse/ast-grep/apply-edits.ts`
5. Create `parse/ast-grep/transform-ts.ts`
6. Create `parse/ast-grep/transform-vue.ts`
7. Create `parse/ast-grep/remove-unused-imports.ts`
8. Create `parse/ast-grep/index.ts`
9. Replace `parse/linters/index.ts` with shim
10. `pnpm run test` — all tests must pass
11. Delete old linter files
12. `pnpm run build && pnpm run check-types && pnpm run test`

## Key Invariants

- `eval.ts` is never touched — `evalCondition()` / `new Function()` stays exactly as-is
- `Extractor` class stays in `linters/common.ts` — the public `FileContext` type must not move
- Multi-pass loop handles nested if-statements cleanly (outer edit on pass N, inner exposed on pass N+1)
- `commitEdits` is NOT used — we use our own `applyEdits` so we can mix HTML-level and TS-level edits with absolute offsets in the Vue case
- All existing unit test assertions pass without modification
