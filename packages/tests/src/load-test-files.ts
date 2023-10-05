import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { combinate } from "@batijs/tests-utils";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

export function listTestFiles() {
  return fg(fg.convertPathToPattern(join(__dirname, "..", "tests", "*.spec.ts")));
}

export async function loadTestFileMatrix(filepath: string) {
  const importFile = isWin ? "file://" + filepath : filepath;
  const f = await import(importFile);

  // TODO sanity check

  return {
    matrix: combinate(f.matrix),
    filepath,
  };
}
