import { readFile } from "node:fs/promises";
import { parseModule, transformAndFormat, type VikeMeta } from "@batijs/core";

interface Node {
  type: string;
}

interface RootNode extends Node {
  body: Node[];
}

export async function mergeDts({
  target,
  fileContent,
  filepath,
  meta,
}: {
  target: string;
  filepath: string;
  fileContent: string;
  meta: VikeMeta;
}) {
  const previousCode = await readFile(target, { encoding: "utf-8" });

  const previousAst = parseModule(previousCode);
  const currentAst = parseModule(fileContent);

  // Merge imports
  for (const imp of previousAst.imports.$items) {
    currentAst.imports[imp.local] = imp;
  }

  const index = (currentAst.$ast as RootNode).body.findIndex(
    (node: Node) => node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration",
  );

  // Merge all non-imports/non-exports nodes
  for (const node of (previousAst.$ast as RootNode).body) {
    if (
      node.type === "ImportDeclaration" ||
      node.type === "ExportNamedDeclaration" ||
      node.type === "ExportDefaultDeclaration"
    ) {
      continue;
    }
    if (index === -1) {
      (currentAst.$ast as RootNode).body.push(node);
    } else {
      (currentAst.$ast as RootNode).body.splice(index, 0, node);
    }
  }

  return transformAndFormat(currentAst.generate().code, meta, {
    filepath,
  });
}
