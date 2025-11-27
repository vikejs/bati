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

  console.log({
    filepath,
    code: currentAst.generate().code,
    clean: res.code,
    previousContent,
    fileContent,
  });

  return clearExports(res.code, meta);
}

export function clearExports(code: string, meta: VikeMeta) {
  if (code.trim() === "export {};") {
    return undefined;
  }
  if (meta.BATI.has("biome")) {
    const index = code.indexOf("\nexport {};");
    const foundImport = code.match(/^import .* from /gm);

    if (index !== -1 && foundImport) {
      return (
        code.slice(0, index) +
        "\n// biome-ignore lint/complexity/noUselessEmptyExport: ensure that the file is considered as a module" +
        code.slice(index)
      );
    }
  }
  return code;
}
