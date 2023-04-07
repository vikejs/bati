import { ok, equal } from "uvu/assert";
import { prettyPrint, types } from "recast";
import type { ast } from "./parse";

export function assertEquivalentAst(
  ast1: ReturnType<typeof ast>,
  ast2: ReturnType<typeof ast>
) {
  if (types.astNodesAreEquivalent(ast1, ast2)) {
    return ok(true);
  } else {
    return equal(
      prettyPrint(ast1, {
        tabWidth: 2,
        reuseWhitespace: false,
        wrapColumn: 120,
      }).code,
      prettyPrint(ast2, {
        tabWidth: 2,
        reuseWhitespace: false,
        wrapColumn: 120,
      }).code
    );
  }
}
