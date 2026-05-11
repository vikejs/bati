import { relative } from "../../relative.js";

export type AllowedContextFlags = "include-if-imported";

export interface FileContext {
  flags: Set<AllowedContextFlags>;
  imports: Set<string>;
}

export function getBatiImportMatch(subject: string) {
  return subject.match(/^@batijs\/[^/]+\/(.+)$/);
}

export class Extractor {
  flags: Set<AllowedContextFlags>;
  imports: Set<string>;
  filename: string;

  constructor(filename: string) {
    this.filename = filename;
    this.flags = new Set();
    this.imports = new Set();
  }

  addImport(imp: string) {
    const matches = getBatiImportMatch(imp);

    if (matches) {
      this.imports.add(relative(this.filename, matches[1]));
    } else {
      this.imports.add(imp);
    }
  }

  deleteImport(imp: string) {
    const matches = getBatiImportMatch(imp);

    if (matches) {
      this.imports.delete(relative(this.filename, matches[1]));
    } else {
      this.imports.delete(imp);
    }
  }

  addFlag(flag: string) {
    this.flags.add(flag as AllowedContextFlags);
  }
}
