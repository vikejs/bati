import type { types } from "recast";
import { parse } from "@typescript-eslint/typescript-estree";
import { lazyfy } from "./utils";

export function ast(code: string) {
  return parse(code, {
    loc: true,
    range: true,
  });
}

function simpleAstExpression(code: string) {
  return ast(code).body[0] as types.namedTypes.ExpressionStatement;
}

export const metaAst = lazyfy({
  VIKE_FRAMEWORK: () => simpleAstExpression("import.meta.VIKE_FRAMEWORK"),
  VIKE_DATABASE: () => simpleAstExpression("import.meta.VIKE_DATABASE"),
});
