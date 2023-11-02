import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flags } from "@batijs/features";
import { combinate } from "@batijs/tests-utils";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

export function listTestFiles() {
  // Windows test on CI are slow and turborepo cache doesn't seem to work properly
  const testFilesGlob = process.env.CI && isWin ? "empty.spec.ts" : "*.spec.ts";
  const pattern = join(__dirname, "..", "tests", testFilesGlob);
  return fg(isWin ? fg.convertPathToPattern(pattern) : pattern);
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

  const validKeys = new Set<unknown>(flags);

  for (const m of matrix as unknown[]) {
    if (Array.isArray(m)) {
      for (const n of m as unknown[]) {
        if (n === undefined || n === null) continue;
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
