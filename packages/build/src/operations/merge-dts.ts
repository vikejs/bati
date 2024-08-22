import { parseModule, transformAndFormat, type VikeMeta } from "@batijs/core";

interface Node {
  type: string;
}

interface RootNode extends Node {
  body: Node[];
}

export async function mergeDts({
  fileContent,
  previousContent,
  filepath,
  meta,
}: {
  filepath: string;
  fileContent: string;
  previousContent: string;
  meta: VikeMeta;
}) {
  const previousAst = parseModule(previousContent);
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

  const res = await transformAndFormat(currentAst.generate().code, meta, {
    filepath,
  });

  return res.code;
}
