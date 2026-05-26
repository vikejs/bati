import { isScalar, isSeq, type Node, parseDocument, visit } from "yaml";
import type { VikeMeta } from "../types.js";
import { evalCondition } from "./eval.js";

const isBatiLine = (line: string) => line.includes("BATI.has") || line.includes("BATI_TEST");

function extractBatiCondition(commentBefore: string | null | undefined): string | null {
  for (const line of commentBefore?.split("\n") ?? []) {
    if (isBatiLine(line)) return line.replace(/^#\s*/, "").trim();
  }
  return null;
}

function stripBatiLines(commentBefore: string | null | undefined): string | undefined {
  const remaining = (commentBefore?.split("\n") ?? []).filter((l) => !isBatiLine(l)).join("\n");
  return remaining.trim() ? remaining : undefined;
}

// Drops the node when its leading `# BATI...` comment evaluates falsy; otherwise
// strips the BATI line(s) and keeps any surrounding comment. Clearing the comment
// before removal stops it from re-attaching to the following sibling.
function resolveBatiComment(node: Node, meta: VikeMeta): typeof visit.REMOVE | undefined {
  const condition = extractBatiCondition(node.commentBefore);
  if (condition === null) return;

  if (!evalCondition(condition, meta)) {
    node.commentBefore = undefined;
    return visit.REMOVE;
  }
  node.commentBefore = stripBatiLines(node.commentBefore);
}

export function transformYaml(code: string, meta: VikeMeta): string {
  const doc = parseDocument(code);

  visit(doc, {
    // Map entries carry the conditional comment on their key.
    Pair(_key, node) {
      if (isScalar(node.key)) return resolveBatiComment(node.key, meta);
    },
    // Sequence items carry it on the item node itself (map or scalar).
    Map(_key, node, path) {
      if (isSeq(path[path.length - 1])) return resolveBatiComment(node, meta);
    },
    Scalar(_key, node, path) {
      if (isSeq(path[path.length - 1])) return resolveBatiComment(node, meta);
    },
  });

  return doc.toString();
}
