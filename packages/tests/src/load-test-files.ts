import { join } from "node:path";
import { dirname } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { combinate } from "@batijs/tests-utils";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function listTestFiles() {
  return fg(join(__dirname, "..", "tests", "*.spec.ts"));
}

export async function loadTestFileMatrix(filepath: string) {
  const f = await import(filepath);

  // TODO sanity check

  return {
    matrix: combinate(f.matrix),
    filepath,
  };
}
