import { namedTypes, visit, type ASTNode, type NodePath } from "ast-types";
import { generateCode } from "magicast";
import type { VikeMeta } from "./types";

function evalCondition(code: string, meta: VikeMeta = {}) {
  code = code.replaceAll("import.meta", "VIKE_META");
  code = `var VIKE_META = ${JSON.stringify(meta)};(${code})`;

  return (0, eval)(code);
}

export function transformAst(tree: ASTNode, meta: VikeMeta) {
  const imports = new Map<string, InstanceType<typeof NodePath<namedTypes.ImportDeclaration>>>();
  const identifiers = new Set<string>();

  visit(tree, {
    visitIdentifier(path) {
      if (path.value.name === "VIKE_REMOVE") {
        if (!path.parent) {
          throw new Error("TODO");
        }
        // Currently supported:
        //   - Removing an element of a statically declared array
        if (!namedTypes.ArrayExpression.check(path.parent?.parent?.value)) {
          throw new Error("TODO: Not supported");
        }
        path.parent.prune();
        this.traverse(path);
        return;
      }

      if (
        namedTypes.ImportDefaultSpecifier.check(path.parent.value) ||
        namedTypes.ImportSpecifier.check(path.parent.value)
      ) {
        let importParent = path.parent;
        while (importParent.value && importParent.value.type !== "ImportDeclaration") {
          importParent = importParent.parent;
        }
        imports.set(path.value.name, importParent);
      } else {
        identifiers.add(path.value.name);
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

      if (!found) {
        this.traverse(path);
        return;
      }

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

      // path was modified, so scan the parent again if possible
      this.traverse(path.parent ? path.parent : path);
    },
  });

  const importsToRemove = new Set(
    Array.from(imports.entries())
      .filter(([name]) => !identifiers.has(name))
      .map(([, node]) => node)
  );

  // Remove unused imports
  importsToRemove.forEach((node) => node.prune());

  return tree;
}
