import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GlobalContext } from "./types.js";

export async function initTmpDir(context: GlobalContext) {
  // turborepo hash seems to include cwd(), so always use the same temp folder
  // context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
  context.tmpdir = join(tmpdir(), "bati");

  // remove previous tests if any
  await rm(context.tmpdir, { recursive: true, force: true });

  // create directories
  await mkdir(context.tmpdir);
  await mkdir(join(context.tmpdir, "packages"));
}
