import { isScalar, isSeq, parseDocument, visit } from "yaml";
import type { VikeMeta } from "../types.js";
import { evalCondition } from "./eval.js";

function isBatiLine(line: string): boolean {
  return line.includes("BATI.has") || line.includes("BATI_TEST");
}

function extractBatiConditionFromYamlComment(commentBefore: string | null | undefined): string | null {
  if (!commentBefore) return null;
  for (const line of commentBefore.split("\n")) {
    if (isBatiLine(line)) {
      return line.replace(/^#\s*/, "").trim();
    }
  }
  return null;
}

function stripBatiLinesFromYamlComment(commentBefore: string | null | undefined): string | undefined {
  if (!commentBefore) return undefined;
  const lines = commentBefore.split("\n");
  const filtered = lines.filter((l) => !isBatiLine(l));
  const result = filtered.join("\n");
  return result.trim() ? result : undefined;
}

export function transformYaml(code: string, meta: VikeMeta): string {
  const doc = parseDocument(code);

  visit(doc, {
    Pair(key, node) {
      if (!isScalar(node.key)) return;
      const commentBefore = node.key.commentBefore;
      const condition = extractBatiConditionFromYamlComment(commentBefore);
      if (condition === null) return;

      const testVal = evalCondition(condition, meta);
      if (!testVal) {
        node.key.commentBefore = undefined;
        return visit.REMOVE;
      } else {
        node.key.commentBefore = stripBatiLinesFromYamlComment(commentBefore);
      }
    },
    Map(key, node, path) {
      const parent = path[path.length - 1];
      if (!isSeq(parent)) return;

      const commentBefore = node.commentBefore;
      const condition = extractBatiConditionFromYamlComment(commentBefore);
      if (condition === null) return;

      const testVal = evalCondition(condition, meta);
      if (!testVal) {
        return visit.REMOVE;
      } else {
        node.commentBefore = stripBatiLinesFromYamlComment(commentBefore);
      }
    },
    Scalar(key, node, path) {
      const parent = path[path.length - 1];
      if (!isSeq(parent)) return;

      const commentBefore = node.commentBefore;
      const condition = extractBatiConditionFromYamlComment(commentBefore);
      if (condition === null) return;

      const testVal = evalCondition(condition, meta);
      if (!testVal) {
        return visit.REMOVE;
      } else {
        node.commentBefore = stripBatiLinesFromYamlComment(commentBefore);
      }
    },
  });

  return doc.toString();
}
