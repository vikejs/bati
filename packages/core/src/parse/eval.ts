import type { SourceCode } from "eslint";
import type { VikeMeta } from "../types.js";

export type ValidEvalResponse = boolean | "remove-comments-only";

export function evalCondition(code: string, meta: VikeMeta): ValidEvalResponse {
  const func = new Function(`{ return function(BATI, BATI_TEST){ return ${code} } };`);
  const result: unknown = func.call(null).call(null, meta.BATI, meta.BATI_TEST);

  if (result !== "remove-comments-only" && typeof result !== "boolean") {
    throw new Error("Condition evaluation failed");
  }

  return result;
}

function _extractCondition(test: string) {
  if (!test.includes("BATI.has") && !test.includes("BATI_TEST")) return null;

  return test.replace(/^# /, "").trim();
}

export function extractBatiCondition(sourceCode: SourceCode, node: { test: { range?: [number, number] } }) {
  if (!node.test.range) return null;

  const test = sourceCode.text.slice(node.test.range[0], node.test.range[1]);

  return _extractCondition(test);
}

export function extractBatiConditionComment(comment: { value: string }) {
  return _extractCondition(comment.value);
}

export function extractBatiGlobalComment(comment: { value: string }) {
  if (!comment.value.includes(" BATI ")) return null;

  return comment.value
    .replace(/^#/, "")
    .replace(/#$/, "")
    .replace(/\s+BATI\s+/, "")
    .trim()
    .split(",");
}
