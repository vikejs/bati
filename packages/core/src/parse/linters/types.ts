import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";

export type Node = (AST.ESLintNode & ESTree.Node) | AST.VNode;

export type Visitors =
  | {
      [P in Node as P["type"]]?: (node: P) => void;
    }
  | {
      ":statement"?: (node: Node) => void;
      ":expression"?: (node: Node) => void;
      ":declaration"?: (node: Node) => void;
      ":function"?: (node: Node) => void;
      ":pattern"?: (node: Node) => void;
    };
