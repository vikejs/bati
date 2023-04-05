import { print, types } from "recast";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import tsconfig from "./tsconfig.json" assert { type: "json" };
import { ast, metaAst } from "./src/parse";

const tree = ast(
  await readFile("./files/tsconfig.json.ts", { encoding: "utf8" })
);

function looseJsonParse(obj: string, meta: Omit<ImportMeta, "url"> = {}) {
  obj = obj.replaceAll("import.meta", "VIKE_META");
  obj = `var VIKE_META = ${JSON.stringify(meta)};(${obj})`;

  obj = ts.transpile(obj, {
    ...(tsconfig.compilerOptions as unknown as ts.CompilerOptions),
    sourceMap: false,
  });

  return (0, eval)(obj);
}

types.visit(tree, {
  visitIfStatement(path) {
    let found = false;

    this.traverse(path.get("test"), {
      visitMemberExpression(path2) {
        if (
          types.astNodesAreEquivalent(
            path2.value,
            metaAst.VIKE_FRAMEWORK.expression
          )
        ) {
          found = true;
        }

        this.traverse(path2);
      },
    });

    if (found) {
      if (
        !looseJsonParse(print(path.value.test).code, {
          VIKE_FRAMEWORK: "solid",
        })
      ) {
        // remove the whole if-block
        path.replace();
      } else {
        // Replace if-block by its content
        if (types.namedTypes.BlockStatement.check(path.value.consequent)) {
          path.replace(...path.value.consequent.body);
        } else {
          path.replace(path.value.consequent);
        }
      }
    }

    this.traverse(path.get("consequent"));
  },
});

console.log(print(tree).code);
