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
  await rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 });
  await mkdir(context.tmpdir);
  await mkdir(join(context.tmpdir, "packages"));
}
