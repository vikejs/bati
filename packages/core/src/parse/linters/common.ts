import { basename } from "node:path";
import { Linter } from "eslint";

export function getLinter() {
  return new Linter({
    configType: "flat",
  });
}

export function verifyAndFix(code: string, config: Linter.FlatConfig[], filename: string) {
  const linter = getLinter();

  const report = linter.verifyAndFix(code, config, basename(filename));

  if (report.messages.length > 0) {
    throw new Error(
      `[eslint] Error while parsing or fixing file ${filename}:\n${report.messages.map((m) => m.message).join("\n")}`,
    );
  }

  return report.output;
}
