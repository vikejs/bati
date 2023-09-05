import { namedTypes, visit } from "ast-types";
import { type ASTNode, generateCode } from "magicast";
import { render } from "squirrelly";
import type { VikeMeta } from "./types.js";
import { cleanImports } from "./cleanup.js";

function evalCondition(code: string, meta: VikeMeta = {}) {
  code = code.replaceAll("import.meta", "BATI_META");
  code = `var BATI_META = ${JSON.stringify(meta)};(${code})`;

  return (0, eval)(code);
}

export function transformAst(tree: ASTNode, meta: VikeMeta) {
  visit(tree, {
    visitJSXAttribute(path) {
      const trailingComment = path.value.comments?.[0];
      if (trailingComment && trailingComment.value.includes("import.meta.BATI_")) {
        if (!evalCondition(trailingComment.value.replace("# ", ""), meta)) {
          // remove attribute + comments
          path.prune();
        } else {
          // remove comments
          path.get("comments").prune();
        }
      }
      this.traverse(path);
    },
    visitImportDeclaration(path) {
      if (
        namedTypes.ImportDeclaration.check(path.value) &&
        path.value.comments &&
        path.value.comments.some((c) => c.value.includes("import.meta.BATI_"))
      ) {
        const comment = path.value.comments.find((c) => c.value.includes("import.meta.BATI_"))!.value;
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
      if (path.value.name === "BATI_REMOVE") {
        if (!path.parent) {
          throw new Error("BATI_REMOVE cannot appear at top level");
        }
        // Currently supported:
        //   - Removing an element of a statically declared array
        if (!namedTypes.ArrayExpression.check(path.parent?.parent?.value)) {
          throw new Error("BATI_REMOVE can only be an array element for now");
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

      // traverse condition content to check if `import.meta.BATI_*` are used
      this.traverse(path.get("test"), {
        visitMemberExpression(path2) {
          if (generateCode(path2.value).code.startsWith("import.meta.BATI_")) {
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
        let root = path;
        // If the expression is as such:
        //   {import.meta.BATI_MODULES?.includes("rpc:telefunc") ? <Link href="/todo">Todo</Link> : undefined}
        // ensures that it writes:
        //   <Link href="/todo">Todo</Link>
        // instead of:
        //   {<Link href="/todo">Todo</Link>}
        if (
          namedTypes.ConditionalExpression.check(path.value) &&
          namedTypes.JSXExpressionContainer.check(path.parent.value)
        ) {
          root = path.parent;
        }
        // Replace if-block by its content
        if (namedTypes.BlockStatement.check(path.value.consequent)) {
          root.replace(...path.value.consequent.body);
        } else {
          root.replace(path.value.consequent);
        }
      }
    },
  });

  return tree;
}

export function transformAstAndGenerate(tree: ASTNode, meta: VikeMeta, options: { filepath?: string } = {}) {
  const ast = transformAst(tree, meta);

  const code = generateCode(ast).code;

  return cleanImports(code, options);
}

export function renderSquirrelly(template: string, meta: VikeMeta): string {
  let output = "";
  try {
    output = render(template, {
      import: {
        meta,
      },
    });
  } catch (e) {
    console.error("SquirrellyJS rendering error:", (e as Error).message);
    throw e;
  }

  return output;
}
