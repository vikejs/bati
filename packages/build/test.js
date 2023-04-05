import { parse, print, types } from "recast";
import { readFile } from "node:fs/promises";
import { createRequire } from "module";
import ts from "typescript";
import tsconfig from "./tsconfig.json" assert { type: "json" };

const require = createRequire(import.meta.url);

const ast = parse(
  await readFile("./files/tsconfig.json.ts", { encoding: "utf8" }),
  { parser: require("recast/parsers/typescript") }
);

const refVikeFramework = parse("import.meta.VIKE_FRAMEWORK", {
  parser: require("recast/parsers/typescript"),
});

function looseJsonParse(obj, meta = {}) {
  obj = obj.replaceAll("import.meta", "VIKE_META");
  obj = `var VIKE_META = ${JSON.stringify(meta)};(${obj})`;

  obj = ts.transpile(obj, {
    ...tsconfig.compilerOptions,
    sourceMap: false,
  });

  return (0, eval)(obj);
}

types.visit(ast, {
  visitIfStatement(path) {
    let found = false;

    this.traverse(path.get("test"), {
      visitMemberExpression(path2) {
        if (
          types.astNodesAreEquivalent(
            path2.value,
            refVikeFramework.program.body[0].expression
          )
        ) {
          console.log("Found import.meta.VIKE_FRAMEWORK");
          found = true;
        }

        this.traverse(path2);
      },
    });

    if (
      found &&
      !looseJsonParse(print(path.value.test).code, {
        VIKE_FRAMEWORK: "solid",
      })
    ) {
      console.log("Deleting block");
      path.replace();
    }

    this.traverse(path.get("consequent"));
  },
});

console.log(print(ast).code);
