import { rm } from "node:fs/promises";
import { join } from "node:path";

export async function clean() {
  await rm(join(process.cwd(), "dist"), { recursive: true, force: true });
}
