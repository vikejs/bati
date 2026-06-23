import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import type { RunnerContext } from "./types.js";

const base = process.env.CI ? process.env.RUNNER_TEMP || tmpdir() : tmpdir();

// Last run's failures, beside the generated-apps dir (which initTmpDir wipes) so `failed` survives runs.
export const failuresFile = join(base, "bati-e2e-failures.json");

export async function initTmpDir(context: RunnerContext) {
  context.tmpdir = join(base, "bati");
  await removeTmpDir(context); // a previous run killed mid-flight may have left it behind
  await mkdir(context.tmpdir);
}

export function removeTmpDir(context: RunnerContext) {
  return rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 });
}
