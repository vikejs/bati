import { Linter, type Rule } from "eslint";
import { getBatiImportMatch } from "./visitor-imports.js";
import { relative } from "../../relative.js";

export type AllowedContextFlags = "include-if-imported";

export interface FileContext {
  flags: Set<AllowedContextFlags>;
  imports: Set<string>;
}

export function getLinter() {
  return new Linter({
    configType: "flat",
  });
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

export function getExtractor(context: Rule.RuleContext): Extractor | undefined {
  return context.settings?.extractor as Extractor;
}

export function verifyAndFix(code: string, config: Linter.Config[], filename: string) {
  const linter = getLinter();
  const extractor = new Extractor(filename);

  const report = linter.verifyAndFix(
    // Short circuit eslint standard inline rules
    code.replaceAll("eslint-disable-next-line", "__BATI_EDNL"),
    [...config, { settings: { extractor } }],
    {
      filename,
    },
  );

  if (report.messages.length > 0) {
    throw new Error(
      `[eslint] Error while parsing or fixing file ${filename}:\n${report.messages
        .map((m) => `${filename}:${m.line}:${m.column} => ${m.message}`)
        .join("\n")}`,
    );
  }

  return {
    // Put back eslint standard inline rules
    code: report.output.replaceAll("__BATI_EDNL", "eslint-disable-next-line"),
    context: extractor,
  };
}
