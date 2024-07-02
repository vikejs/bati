import { Linter, type Rule } from "eslint";

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

  constructor() {
    this.flags = new Set();
    this.imports = new Set();
  }

  addImport(imp: string) {
    this.imports.add(imp);
  }

  addFlag(flag: string) {
    this.flags.add(flag as AllowedContextFlags);
  }
}

export function getExtractor(context: Rule.RuleContext): Extractor | undefined {
  return context.settings?.extractor as Extractor;
}

export function verifyAndFix(code: string, config: Linter.FlatConfig[], filename: string) {
  const linter = getLinter();
  const extractor = new Extractor();

  const report = linter.verifyAndFix(code, [...config, { settings: { extractor } }], {
    filename,
  });

  if (report.messages.length > 0) {
    throw new Error(
      `[eslint] Error while parsing or fixing file ${filename}:\n${report.messages
        .map((m) => `${filename}:${m.line}:${m.column} => ${m.message}`)
        .join("\n")}`,
    );
  }

  return {
    code: report.output,
    context: extractor,
  };
}
