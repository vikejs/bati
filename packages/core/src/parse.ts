import { namedTypes, visit } from "ast-types";
import { type ASTNode, generateCode } from "magicast";
import type { VikeMeta } from "./types.js";
import { cleanImports } from "./cleanup.js";

function evalCondition(code: string, meta: VikeMeta = {}) {
  code = code.replaceAll("import.meta", "VIKE_META");
  code = `var VIKE_META = ${JSON.stringify(meta)};(${code})`;

  return (0, eval)(code);
}

export function transformAst(tree: ASTNode, meta: VikeMeta) {
  visit(tree, {
    visitImportDeclaration(path) {
      if (
        namedTypes.ImportDeclaration.check(path.value) &&
        path.value.comments &&
        path.value.comments.some((c) => c.value.startsWith("# import.meta.VIKE_"))
      ) {
        const comment = path.value.comments.find((c) => c.value.startsWith("# import.meta.VIKE_"))!.value;
        if (!evalCondition(comment.replace("# ", ""), meta)) {
          // remove import + comments
          path.prune();
        } else {
          // remove comments
          path.value.comments = [];
        }
      }
      this.traverse(path);
    },
    visitIdentifier(path) {
      if (path.value.name === "VIKE_REMOVE") {
        if (!path.parent) {
          throw new Error("VIKE_REMOVE cannot appear at top level");
        }
        // Currently supported:
        //   - Removing an element of a statically declared array
        if (!namedTypes.ArrayExpression.check(path.parent?.parent?.value)) {
          throw new Error("VIKE_REMOVE can only be an array element for now");
        }
        path.parent.prune();
        this.traverse(path);
        return;
      }
      this.traverse(path);
    },
    visitConditionalExpression(path) {
      // typing definition is all wrong
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).visitIfStatement(path);
    },
    visitIfStatement(path) {
      let found = false;

      // traverse condition content to check if `import.meta.VIKE_*` are used
      this.traverse(path.get("test"), {
        visitMemberExpression(path2) {
          if (generateCode(path2.value).code.startsWith("import.meta.VIKE_")) {
            found = true;
          }

          this.traverse(path2);
        },
      });

      this.traverse(path);
      if (!found) return;

      if (!evalCondition(generateCode(path.value.test).code, meta)) {
        // else-block exists
        if (path.value.alternate) {
          // Replace the whole if-block by its else-block content
          if (namedTypes.BlockStatement.check(path.value.alternate)) {
            path.replace(...path.value.alternate.body);
          } else {
            path.replace(path.value.alternate);
          }
        } else {
          // remove the whole if-block
          path.prune();
        }
      } else {
        // Replace if-block by its content
        if (namedTypes.BlockStatement.check(path.value.consequent)) {
          path.replace(...path.value.consequent.body);
        } else {
          path.replace(path.value.consequent);
        }
      }
    },
  });

  return tree;
}

export function transformAndGenerate(tree: ASTNode, meta: VikeMeta) {
  const ast = transformAst(tree, meta);

  const code = generateCode(ast).code;

  return cleanImports(code);
}
