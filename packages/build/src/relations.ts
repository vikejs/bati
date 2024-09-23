import { extname } from "node:path";

export class RelationFile {
  public static allPathAbsolute: Map<string, RelationFile> = new Map();
  public static allIncludeIfImported: RelationFile[] = [];

  constructor(
    public pathAbsolute: string,
    public includeIfImported: boolean,
  ) {
    RelationFile.allPathAbsolute.set(pathAbsolute, this);
    if (includeIfImported) {
      RelationFile.allIncludeIfImported.push(this);
    }
  }
}

export class RelationImport {
  public static allImports: RelationImport[] = [];

  constructor(
    public source: RelationFile,
    public importTarget: string,
  ) {
    RelationImport.allImports.push(this);
  }

  get importTargetRelationFile(): RelationFile | undefined {
    const potentialTargets = importToPotentialTargets(this.importTarget);

    for (const target of potentialTargets) {
      if (RelationFile.allPathAbsolute.has(target)) {
        return RelationFile.allPathAbsolute.get(target);
      }
    }
  }

  static computeUnimportedFiles(): RelationFile[] {
    const unimportedFiles: RelationFile[] = [];
    const importedByVolatileFile: RelationImport[] = [];
    for (const file of RelationFile.allIncludeIfImported) {
      const importedFile = RelationImport.allImports.find((ai) => ai.importTargetRelationFile === file);
      if (!importedFile) {
        unimportedFiles.push(file);
      } else if (importedFile.source.includeIfImported) {
        importedByVolatileFile.push(importedFile);
      }
    }

    return computeDeepUnimportedFiles(importedByVolatileFile, unimportedFiles);
  }
}

function computeDeepUnimportedFiles(importedByVolatileFile: RelationImport[], unimportedFiles: RelationFile[]) {
  const copyImportedByVolatileFile = Array.from(importedByVolatileFile);
  let redo = false;
  for (const relationImport of copyImportedByVolatileFile) {
    const found = unimportedFiles.find((uf) => uf === relationImport.source);

    if (found) {
      redo = true;
      unimportedFiles.push(relationImport.importTargetRelationFile!);
      importedByVolatileFile = importedByVolatileFile.filter((i) => i !== relationImport);
    }
  }
  if (redo) {
    computeDeepUnimportedFiles(importedByVolatileFile, unimportedFiles);
  }
  return unimportedFiles;
}

function importToPotentialTargets(imp: string): string[] {
  let subject = imp;
  const ext = extname(imp);
  const targets: string[] = [];

  if (ext.match(/^\.[jt]sx?$/)) {
    subject = subject.replace(/^\.[jt]sx?$/, "");
  }

  if (!ext || subject !== imp) {
    targets.push(...[".js", ".jsx", ".ts", ".tsx", ".cjs", ".mjs"].map((e) => `${subject}${e}`));
  } else {
    targets.push(imp);
  }

  return targets;
}
