import type { SourceCode } from "eslint";
import type { VikeMeta } from "../types.js";

export function evalCondition(code: string, meta: VikeMeta): boolean {
  const func = new Function(`{ return function(BATI){ return ${code} } };`);
  const result = func.call(null).call(null, meta.BATI);

  if (typeof result !== "boolean") {
    throw new Error("Condition evaluation failed");
  }

  return result;
}

export function hasBatiCondition(value: string, flags?: string) {
  return value.match(new RegExp("BATI\\.has", flags)) !== null;
}

export function extractBatiCondition(sourceCode: SourceCode, node: { test: { range?: [number, number] } }) {
  if (!node.test.range) return null;

  const test = sourceCode.text.slice(node.test.range[0], node.test.range[1]);
  if (!hasBatiCondition(test)) return null;

  return test.trim();
}

export function extractBatiConditionComment(comment: { value: string }) {
  if (!hasBatiCondition(comment.value)) return null;

  return comment.value.replace(/^# /, "").trim();
}

export function extractBatiConditionHTMLAttribute(attributeName: string) {
  if (!hasBatiCondition(attributeName, "i")) return null;

  return attributeName.replace(/bati\.has\((.*)\)\?.*/i, 'BATI.has("$1")');
}
