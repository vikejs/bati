import { ok } from "uvu/assert";
import { types } from "recast";
import type { ast } from "./parse";

class AstNotEquivalentError extends Error {
  constructor(protected path: string[]) {
    super();
  }

  get message() {
    return `AstNotEquivalentError: ${this.path.join(".")}`;
  }
}

export function assertEquivalentAst(
  ast1: ReturnType<typeof ast>,
  ast2: ReturnType<typeof ast>
) {
  const path: string[] = [];
  return ok(
    types.astNodesAreEquivalent(ast1, ast2, path),
    new AstNotEquivalentError(path)
  );
}
