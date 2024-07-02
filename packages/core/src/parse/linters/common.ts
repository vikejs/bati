import { Linter } from "eslint";

export interface FileContext {
  flags: Set<string>;
}

export function getLinter() {
  return new Linter({
    configType: "flat",
  });
}

export function verifyAndFix(code: string, config: Linter.FlatConfig[], filename: string) {
  const linter = getLinter();
  const context: FileContext = {
    flags: new Set(),
  };

  const report = linter.verifyAndFix(code, config, {
    // Extract metadata from global comment
    postprocess(messages) {
      const ret: Linter.LintMessage[] = [];

      for (const message of messages.flat(1)) {
        if (typeof message.message === "string") {
          ret.push(message);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const m: any = message.message;

          if ("flags" in m && Array.isArray(m.flags)) {
            m.flags.forEach((flag: string) => context.flags.add(flag));
          }

          ret.push({
            ...message,
            message: "extracted-flags",
          });
        }
      }

      return ret;
    },
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
    context,
  };
}
