import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GlobalContext } from "./types.js";
import process from "process";

export async function initTmpDir(context: GlobalContext) {
  // turborepo hash seems to include cwd(), so always use the same temp folder
  // context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
  context.tmpdir = join(process.env.CI ? process.env.RUNNER_TEMP || tmpdir() : tmpdir(), "bati");

  // remove previous tests if any
  await rm(context.tmpdir, { recursive: true, force: true, maxRetries: 2 });

  // create directories
  await mkdir(context.tmpdir);
  await mkdir(join(context.tmpdir, "packages"));
}
