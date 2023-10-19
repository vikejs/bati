import type { TSESTree } from "@typescript-eslint/utils";
import type * as ESTree from "estree";
import type AST from "vue-eslint-parser/ast";

export type Node = (AST.ESLintNode & TSESTree.Node) | AST.VNode | TSESTree.Node;

export type Visitors<N extends ESTree.Node | AST.Node | TSESTree.Node = Node> =
  | {
      [P in N as P["type"]]?: (node: P) => void;
    }
  | {
      ":statement"?: (node: N) => void;
      ":expression"?: (node: N) => void;
      ":declaration"?: (node: N) => void;
      ":function"?: (node: N) => void;
      ":pattern"?: (node: N) => void;
    };
