import { print, prettyPrint, types } from "recast";
import { parse } from "@typescript-eslint/typescript-estree";
import { lazyfy } from "./utils";
import { evalCondition } from "./eval";

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

export function transformAst(tree: ReturnType<typeof ast>, meta: VikeMeta) {
  const imports = new Map<
    string,
    InstanceType<typeof types.NodePath<types.namedTypes.ImportDeclaration>>
  >();
  const identifiers = new Set<string>();

  types.visit(tree, {
    visitIdentifier(path) {
      if (path.value.name === "VIKE_REMOVE") {
        if (!path.parent) {
          throw new Error("TODO");
        }
        // Currently supported:
        //   - Removing an element of a statically declared array
        if (
          !types.namedTypes.ArrayExpression.check(path.parent?.parent?.value)
        ) {
          throw new Error("TODO: Not supported");
        }
        path.parent.prune();
        this.traverse(path);
        return;
      }

      if (
        types.namedTypes.ImportDefaultSpecifier.check(path.parent.value) ||
        types.namedTypes.ImportSpecifier.check(path.parent.value)
      ) {
        let importParent = path.parent;
        while (
          importParent.value &&
          importParent.value.type !== "ImportDeclaration"
        ) {
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
      (this as any).visitIfStatement(path);
    },
    visitIfStatement(path) {
      let found = false;

      // traverse condition content to check if `import.meta.VIKE_*` are used
      this.traverse(path.get("test"), {
        visitMemberExpression(path2) {
          if (print(path2.value).code.startsWith("import.meta.VIKE_")) {
            found = true;
          }

          this.traverse(path2);
        },
      });

      if (!found) {
        this.traverse(path);
        return;
      }

      if (!evalCondition(print(path.value.test).code, meta)) {
        // else-block exists
        if (path.value.alternate) {
          // Replace the whole if-block by its else-block content
          if (types.namedTypes.BlockStatement.check(path.value.alternate)) {
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
        if (types.namedTypes.BlockStatement.check(path.value.consequent)) {
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

export function transform(tree: ReturnType<typeof ast>, meta: VikeMeta) {
  return prettyPrint(transformAst(tree, meta), {
    tabWidth: 2,
    reuseWhitespace: false,
    wrapColumn: 120,
  }).code;
}
