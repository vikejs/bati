import type { Lang, SgNode } from "@ast-grep/napi";
import { parse } from "@ast-grep/napi";
import { evalCondition, extractBatiConditionComment, extractBatiGlobalComment } from "../eval.js";
import { getBatiImportMatch } from "../linters/common.js";
import { relative } from "../../relative.js";
import type { Extractor } from "../linters/common.js";
import type { VikeMeta } from "../../types.js";
import { applyEdits, type TextEdit } from "./apply-edits.js";

function hasBatiCondition(text: string): boolean {
  return text.includes("BATI.has") || text.includes("BATI_TEST");
}

function removeNode(node: SgNode): TextEdit {
  return { startIndex: node.range().start.index, endIndex: node.range().end.index, newText: "" };
}

// Remove node + trailing comma (no newline) — mirrors ESLint fixer.removeRange behavior
function removeNodeWithTrailing(node: SgNode, code: string): TextEdit {
  const start = node.range().start.index;
  let end = node.range().end.index;
  // consume trailing spaces/tabs then a comma (stop after comma)
  while (end < code.length && (code[end] === " " || code[end] === "\t")) end++;
  if (end < code.length && code[end] === ",") end++;
  return { startIndex: start, endIndex: end, newText: "" };
}

// Unwrap else_clause to get the actual body statement
function getElseBody(altNode: SgNode): SgNode {
  if (altNode.kind() === "else_clause") {
    const body = altNode.children().find((c) => c.kind() !== "else");
    if (body) return body;
  }
  return altNode;
}

function replaceWithBranchBody(ifNode: SgNode, branch: SgNode): TextEdit {
  const start = ifNode.range().start.index;
  const end = ifNode.range().end.index;
  const actual = getElseBody(branch);
  if (actual.kind() === "statement_block") {
    // strip outer { }
    const inner = actual.text().slice(1, -1);
    return { startIndex: start, endIndex: end, newText: inner };
  }
  return { startIndex: start, endIndex: end, newText: actual.text() };
}

// Named children of a node (excludes anonymous punctuation like ? : , etc.)
function namedChildren(node: SgNode): SgNode[] {
  return node.children().filter((c) => c.isNamed());
}

// For ternary inside JSX {expr}: when chosen is JSX/null/undefined, unwrap the {} container
function resolveJsxContainerEdit(node: SgNode, chosen: SgNode): TextEdit {
  const parent = node.parent();
  const chosenText = chosen.text();
  const isNullish = chosenText === "null" || chosenText === "undefined";
  if (
    parent &&
    parent.kind() === "jsx_expression" &&
    (chosen.kind() === "jsx_element" ||
      chosen.kind() === "jsx_self_closing_element" ||
      chosen.kind() === "jsx_fragment" ||
      isNullish)
  ) {
    return {
      startIndex: parent.range().start.index,
      endIndex: parent.range().end.index,
      newText: isNullish ? "" : chosenText,
    };
  }
  return {
    startIndex: node.range().start.index,
    endIndex: node.range().end.index,
    newText: chosenText,
  };
}

function collectConsecutiveCommentSiblings(commentNode: SgNode): SgNode[] {
  const result: SgNode[] = [commentNode];
  let cur: SgNode | null = commentNode.next();
  while (cur && cur.kind() === "comment") {
    result.push(cur);
    cur = cur.next();
  }
  return result;
}

function resolveBatiIfType(
  members: SgNode[],
  meta: VikeMeta,
): { resolved: string | undefined; fallback: string | undefined } {
  let fallback: string | undefined;
  let resolved: string | undefined;

  for (const member of members) {
    const children = member.children();
    const keyNode = children.find((c) => c.kind() === "string" || c.kind() === "property_identifier");
    if (!keyNode) continue;

    const condition = keyNode.kind() === "string" ? keyNode.text().slice(1, -1) : keyNode.text();
    const typeAnnotation = children.find((c) => c.kind() === "type_annotation");
    if (!typeAnnotation) continue;

    // type_annotation children: [":", actualType]
    const actualType = typeAnnotation.children().find((c) => c.kind() !== ":");
    if (!actualType) continue;
    const valueText = actualType.text();

    if (condition === "_") {
      fallback = valueText;
      continue;
    }

    const testVal = evalCondition(condition, meta);
    if (testVal) {
      resolved = valueText;
      break;
    }
  }

  return { resolved, fallback };
}

function runOnePass(code: string, lang: Lang, filename: string, meta: VikeMeta, extractor: Extractor): string {
  const root = parse(lang, code).root();
  const edits: TextEdit[] = [];
  const handledComments = new Set<number>();

  // A. if_statement
  for (const node of root.findAll({ rule: { kind: "if_statement" } })) {
    const cond = node.field("condition");
    if (!cond || !hasBatiCondition(cond.text())) continue;

    const condText = cond.text().replace(/^# /, "").trim();
    const testVal = evalCondition(condText, meta);
    const consequent = node.field("consequence");
    const alternate = node.field("alternative");

    if (testVal) {
      if (consequent) edits.push(replaceWithBranchBody(node, consequent));
    } else if (alternate) {
      edits.push(replaceWithBranchBody(node, alternate));
    } else {
      edits.push(removeNode(node));
    }
  }

  // B. ternary_expression
  for (const node of root.findAll({ rule: { kind: "ternary_expression" } })) {
    // Use named children: [condition, consequence, alternative]
    const kids = namedChildren(node);
    if (kids.length < 3) continue;
    const [condNode, conseqNode, altNode] = kids;
    if (!hasBatiCondition(condNode.text())) continue;

    const condText = condNode.text().replace(/^# /, "").trim();
    const testVal = evalCondition(condText, meta);
    const chosen = testVal ? conseqNode : altNode;

    edits.push(resolveJsxContainerEdit(node, chosen));
  }

  // C. comment-based conditions (//# BATI.has(...) before a statement)
  for (const commentNode of root.findAll({ rule: { kind: "comment" } })) {
    const idx = commentNode.range().start.index;
    if (handledComments.has(idx)) continue;

    const raw = commentNode.text();
    if (!raw.startsWith("//")) continue;

    const condition = extractBatiConditionComment({ value: raw.slice(2) });
    if (!condition) continue;

    const allLeading = collectConsecutiveCommentSiblings(commentNode);
    for (const c of allLeading) handledComments.add(c.range().start.index);

    const targetNode = allLeading[allLeading.length - 1].next();
    const testVal = evalCondition(condition, meta);
    const removeCommentsOnly = allLeading.length > 1 && testVal === "remove-comments-only";

    if (!testVal || testVal === "remove-comments-only") {
      // Remove all leading BATI comments (just the comment text, like ESLint fixer.remove)
      for (const c of allLeading) edits.push(removeNode(c));
      // Also remove the target node (unless remove-comments-only)
      if (!removeCommentsOnly && targetNode) {
        edits.push(removeNodeWithTrailing(targetNode, code));
      }
    } else {
      // Condition true: remove only the BATI condition comment itself
      edits.push(removeNode(commentNode));
    }
  }

  // D. global file comment /*# BATI include-if-imported #*/
  for (const node of root.findAll({ rule: { kind: "comment" } })) {
    if (node.range().start.index !== 0) continue;
    const raw = node.text();
    if (!raw.startsWith("/*")) continue;

    const flags = extractBatiGlobalComment({ value: raw.slice(2, -2) });
    if (!flags || flags.length === 0) break;

    for (const flag of flags) {
      const f = flag.trim();
      if (f === "include-if-imported") {
        extractor.addFlag("include-if-imported");
      } else {
        throw new Error(`Unknown BATI file flag ${f}`);
      }
    }
    edits.push(removeNode(node));
    break;
  }

  // E. import rewrites: @batijs/… → relative path
  for (const node of root.findAll({ rule: { kind: "import_statement" } })) {
    const src = node.field("source");
    if (!src) continue;
    const srcText = src.text();
    const path = srcText.slice(1, -1); // strip quotes
    const match = getBatiImportMatch(path);
    if (match) {
      const newPath = relative(filename, match[1]);
      extractor.addImport(newPath);
      edits.push({
        startIndex: src.range().start.index + 1,
        endIndex: src.range().end.index - 1,
        newText: newPath,
      });
    } else if (path.startsWith("./") || path.startsWith("../")) {
      extractor.addImport(path);
    }
  }

  // F. BATI.Any — `expr as BATI.Any` → `expr`
  for (const node of root.findAll({ rule: { kind: "as_expression" } })) {
    const kids = namedChildren(node);
    if (kids.length < 2) continue;
    const typeNode = kids[kids.length - 1];
    if (typeNode.text() !== "BATI.Any") continue;
    const valueNode = kids[0];
    // Remove " as BATI.Any" (from end of value to end of as_expression)
    edits.push({
      startIndex: valueNode.range().end.index,
      endIndex: node.range().end.index,
      newText: "",
    });
  }

  // G. BATI.If<{…}> and BATI.IfAsUnknown<{…}> — generic type conditionals
  for (const node of root.findAll({ rule: { kind: "generic_type" } })) {
    const nameNode = node.field("name");
    if (!nameNode) continue;
    const nameText = nameNode.text();
    if (nameText !== "BATI.If" && nameText !== "BATI.IfAsUnknown") continue;

    const typeArgs = node.field("type_arguments");
    if (!typeArgs) continue;

    const objectType = typeArgs.children().find((c) => c.kind() === "object_type");
    if (!objectType) continue;

    const members = objectType.children().filter((c) => c.kind() === "property_signature");
    const { resolved, fallback } = resolveBatiIfType(members, meta);
    const chosen = resolved ?? fallback;

    const parentNode = node.parent();
    const isIfAsUnknown = nameText === "BATI.IfAsUnknown";

    if (parentNode && parentNode.kind() === "as_expression") {
      // `expr as BATI.If<{...}>` — replace the whole "as ..." part
      const parentKids = namedChildren(parentNode);
      const valueNode = parentKids[0];
      if (!valueNode) continue;
      const rangeStart = valueNode.range().end.index;
      const rangeEnd = parentNode.range().end.index;

      if (chosen !== undefined) {
        edits.push({
          startIndex: rangeStart,
          endIndex: rangeEnd,
          newText: isIfAsUnknown ? ` as unknown as ${chosen}` : ` as ${chosen}`,
        });
      } else {
        // No match, no fallback — remove " as BATI.If<{...}>"
        edits.push({ startIndex: rangeStart, endIndex: rangeEnd, newText: "" });
      }
    } else if (parentNode && parentNode.kind() === "type_annotation") {
      // `const a: BATI.If<{...}> = ...` or `prop: BATI.If<{...}>`
      if (chosen !== undefined) {
        // Replace just the generic_type node
        edits.push({
          startIndex: node.range().start.index,
          endIndex: node.range().end.index,
          newText: chosen,
        });
      } else {
        // No match, no fallback — remove the type_annotation entirely (includes the colon)
        edits.push(removeNode(parentNode));
      }
    } else {
      // Inside type_arguments, e.g. fn<BATI.If<{...}>>() — replace the generic_type
      if (chosen !== undefined) {
        edits.push({
          startIndex: node.range().start.index,
          endIndex: node.range().end.index,
          newText: chosen,
        });
      } else {
        edits.push(removeNode(node));
      }
    }
  }

  return applyEdits(code, edits);
}

export function transformTs(code: string, lang: Lang, filename: string, meta: VikeMeta, extractor: Extractor): string {
  let current = code;
  for (let pass = 0; pass < 10; pass++) {
    const next = runOnePass(current, lang, filename, meta, extractor);
    if (next === current) break;
    current = next;
  }
  return current;
}
