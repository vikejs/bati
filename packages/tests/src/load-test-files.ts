import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flags } from "@batijs/features";
import { type Balancer, combinate, Suite } from "@batijs/tests-utils";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

export function listTestFiles() {
  const testFilesGlob = "*.spec.ts";
  const pattern = join(__dirname, "..", "tests", testFilesGlob);
  return fg(isWin ? fg.convertPathToPattern(pattern) : pattern);
}

export function assert(condition: unknown, message: string): asserts condition {
  if (condition) {
    return;
  }
  throw new Error(message);
}

export async function loadTestFileMatrix(filepath: string, balancer: Balancer) {
  const defaultErrorMessage = `\`matrix\` export in "${filepath}" must be of type \`(string | string[])[]\``;
  const importFile = isWin ? `file://${filepath}` : filepath;
  const f = await import(importFile);

  const validKeys = new Set<unknown>(flags);

  // New API: `export default suite()...` — the balancer resolves spread markers.
  if (f.default instanceof Suite) {
    const matrix = f.default.flatten(balancer);
    for (const combo of matrix) {
      for (const flag of combo) {
        assert(validKeys.has(flag), `default Suite in "${filepath}" produced unknown feature "${flag}"`);
      }
    }
    return { matrix, exclude: undefined, filepath };
  }

  // Legacy API: `export const matrix`, optional `export const exclude`.
  const matrix: unknown = f.matrix;
  const exclude: unknown = f.exclude;

  assert(matrix, `Missing \`matrix\` export in "${filepath}"`);
  assert(Array.isArray(matrix), defaultErrorMessage);
  if (exclude) {
    assert(Array.isArray(exclude), `\`exclude\` export in "${filepath}" must be of type \`string[][]\``);
  }

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
    exclude: exclude as string[][] | undefined,
    filepath,
  };
}
