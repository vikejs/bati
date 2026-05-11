import type { SgNode } from "@ast-grep/napi";
import { Lang, parse } from "@ast-grep/napi";
import type { VikeMeta } from "../../types.js";
import { evalCondition, extractBatiConditionComment, hasBatiCondition } from "../eval.js";
import type { Extractor } from "../linters/common.js";
import { applyEdits, removeNodeWithNewline, type TextEdit } from "./apply-edits.js";
import { transformTs } from "./transform-ts.js";

function findTemplateElement(root: SgNode): SgNode | null {
  for (const child of root.children()) {
    if (child.kind() !== "element") continue;
    const startTag = child.children().find((c) => c.kind() === "start_tag");
    if (!startTag) continue;
    const tagName = startTag.children().find((c) => c.kind() === "tag_name");
    if (tagName?.text() === "template") return child;
  }
  return null;
}

// Process {{ expr }} interpolations in template text nodes
function processTemplateInterpolations(text: string, filename: string, meta: VikeMeta, extractor: Extractor): string {
  return text.replace(/\{\{([\s\S]*?)\}\}/g, (match, expr: string) => {
    if (!hasBatiCondition(expr)) return match;
    const transformed = transformTs(expr.trim(), Lang.TypeScript, filename, meta, extractor);
    return `{{ ${transformed.trim()} }}`;
  });
}

function collectVueTemplateEdits(
  templateEl: SgNode,
  code: string,
  filename: string,
  meta: VikeMeta,
  extractor: Extractor,
  edits: TextEdit[],
) {
  const processedComments = new Set<number>();

  // Handle HTML comments with BATI conditions before elements
  for (const commentNode of templateEl.findAll({ rule: { kind: "comment" } })) {
    const idx = commentNode.range().start.index;
    if (processedComments.has(idx)) continue;
    processedComments.add(idx);

    const raw = commentNode.text();
    if (!raw.startsWith("<!--")) continue;

    // HTML comment: <!-- BATI.has("vue") -->  strip <!-- and -->
    const condition = extractBatiConditionComment({ value: raw.slice(4, -3) });
    if (!condition) continue;

    const testVal = evalCondition(condition, meta);

    // Collect any following comments before the actual element
    const followingComments: SgNode[] = [];
    let cur: SgNode | null = commentNode.next();
    while (cur && cur.kind() === "comment") {
      followingComments.push(cur);
      processedComments.add(cur.range().start.index);
      cur = cur.next();
    }
    const targetEl = cur; // first non-comment sibling (the HTML element)

    if (!testVal) {
      edits.push(removeNodeWithNewline(commentNode, code));
      for (const fc of followingComments) edits.push(removeNodeWithNewline(fc, code));
      if (targetEl) edits.push(removeNodeWithNewline(targetEl, code));
    } else {
      // Keep element and any reference comments; remove only the BATI condition comment
      edits.push(removeNodeWithNewline(commentNode, code));
    }
  }

  // Handle {{ BATI.has(...) ? ... : ... }} template interpolations
  for (const textNode of templateEl.findAll({ rule: { kind: "text" } })) {
    if (!hasBatiCondition(textNode.text())) continue;
    const text = textNode.text();
    const start = textNode.range().start.index;
    const processed = processTemplateInterpolations(text, filename, meta, extractor);
    if (processed !== text) {
      edits.push({ startIndex: start, endIndex: start + text.length, newText: processed });
    }
  }
}

export function transformVue(code: string, filename: string, meta: VikeMeta, extractor: Extractor): string {
  const root = parse(Lang.Html, code).root();
  const edits: TextEdit[] = [];

  // Transform <script> section
  const scriptEl = root.find({ rule: { kind: "script_element" } });
  if (scriptEl) {
    const rawText = scriptEl.find({ rule: { kind: "raw_text" } });
    if (rawText) {
      const scriptContent = rawText.text();
      const scriptOffset = rawText.range().start.index;
      const transformed = transformTs(scriptContent, Lang.TypeScript, filename, meta, extractor);
      if (transformed !== scriptContent) {
        edits.push({
          startIndex: scriptOffset,
          endIndex: scriptOffset + scriptContent.length,
          newText: transformed,
        });
      }
    }
  }

  // Transform <template> section
  const templateEl = findTemplateElement(root);
  if (templateEl) {
    collectVueTemplateEdits(templateEl, code, filename, meta, extractor, edits);
  }

  return applyEdits(code, edits);
}
