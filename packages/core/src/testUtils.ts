import { ok, equal } from "uvu/assert";
import { generateCode, type ASTNode } from "magicast";
import types from "ast-types";

export function assertEquivalentAst(ast1: ASTNode, ast2: ASTNode) {
  if (types.astNodesAreEquivalent(ast1, ast2)) {
    return ok(true);
  } else {
    return equal(
      generateCode(ast1, {
        tabWidth: 2,
        reuseWhitespace: false,
        wrapColumn: 120,
      }).code,
      generateCode(ast2, {
        tabWidth: 2,
        reuseWhitespace: false,
        wrapColumn: 120,
      }).code
    );
  }
}
