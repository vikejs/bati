import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flags } from "@batijs/core";
import { combinate } from "@batijs/tests-utils";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

export function listTestFiles() {
  // FIXME: cache on CI not working properly, so we limit the scope
  const pattern = isWin
    ? fg.convertPathToPattern(join(__dirname, "..", "tests", process.env.CI ? "empty.spec.ts" : "*.spec.ts"))
    : join(__dirname, "..", "tests", "*.spec.ts");
  return fg(pattern);
}

export function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    return;
  }
  throw new Error(message);
}

export async function loadTestFileMatrix(filepath: string) {
  const defaultErrorMessage = `\`matrix\` export in "${filepath}" must be of type \`(string | string[])[]\``;
  const importFile = isWin ? "file://" + filepath : filepath;
  const f = await import(importFile);

  const matrix: unknown = f.matrix;

  assert(matrix, `Missing \`matrix\` export in "${filepath}"`);
  assert(Array.isArray(matrix), defaultErrorMessage);

  const validKeys = new Set<unknown>(flags.keys());

  for (const m of matrix as unknown[]) {
    if (Array.isArray(m)) {
      for (const n of m as unknown[]) {
        assert(typeof n === "string", defaultErrorMessage);
        assert(validKeys.has(n), `\`matrix\` export in "${filepath}" has unknown feature "${n}"`);
      }
    } else {
      assert(typeof m === "string", defaultErrorMessage);
      assert(validKeys.has(m), `\`matrix\` export in "${filepath}" has unknown feature "${m}"`);
    }
  }

  return {
    matrix: combinate(matrix),
    filepath,
  };
}
