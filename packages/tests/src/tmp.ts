import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import type { RunnerContext } from "./types.js";

export async function initTmpDir(context: RunnerContext) {
  // always use the same temp folder for predictable cleanup
  // context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
  context.tmpdir = join(process.env.CI ? process.env.RUNNER_TEMP || tmpdir() : tmpdir(), "bati");

  // remove previous tests if any
  await rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 });

  // create directories
  await mkdir(context.tmpdir);
  await mkdir(join(context.tmpdir, "packages"));
}
