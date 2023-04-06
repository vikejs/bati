import { readFile } from "node:fs/promises";
import { ast, transform } from "./src/parse";

const tree = ast(
  await readFile("./files/tsconfig.json.ts", { encoding: "utf8" })
);

const code = transform(tree, {
  VIKE_FRAMEWORK: "solid",
});

console.log(code);
