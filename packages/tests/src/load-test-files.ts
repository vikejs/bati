import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { flags } from "@batijs/features";
import { type Balancer, Suite } from "@batijs/tests-utils";
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
  const importFile = isWin ? `file://${filepath}` : filepath;
  const f = await import(importFile);

  assert(f.default instanceof Suite, `"${filepath}" must \`export default suite()...\``);

  // The balancer resolves `.spread()` markers; combos are validated against known flags.
  const matrix = f.default.flatten(balancer);
  const validKeys = new Set<unknown>(flags);
  for (const combo of matrix) {
    for (const flag of combo) {
      assert(validKeys.has(flag), `default Suite in "${filepath}" produced unknown feature "${flag}"`);
    }
  }

  return { matrix, filepath };
}
