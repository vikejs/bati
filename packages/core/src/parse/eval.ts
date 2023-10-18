import type { SourceCode } from "eslint";
import type { VikeMeta } from "../types.js";

export function evalCondition(code: string, meta: VikeMeta = {}): boolean {
  code = code.replaceAll("import.meta", "BATI_META");
  code = `var BATI_META = ${JSON.stringify(meta)};(${code})`;

  const result = (0, eval)(code);

  if (typeof result !== "boolean") {
    throw new Error("Condition evaluation failed");
  }

  return result;
}

export function extractBatiCondition(sourceCode: SourceCode, node: { test: { range: [number, number] } }) {
  const test = sourceCode.text.slice(node.test.range[0], node.test.range[1]);
  if (!test.includes("import.meta.BATI_")) return null;

  return test.trim();
}

export function extractBatiConditionComment(comment: { value: string }) {
  if (!comment.value.includes("import.meta.BATI_")) return null;

  return comment.value.replace(/^# /, "").trim();
}
