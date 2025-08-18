import { copyFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { globby } from "globby";

export async function copyFilesToDist() {
  const files = await globby(["./files/**/!($*)", "./files/**/$$*"], {
    cwd: process.cwd(),
  });

  for (const file of files) {
    const dist = path.join("dist", file);
    const distDirname = path.dirname(dist);

    await mkdir(distDirname, { recursive: true });
    await copyFile(file, dist);
  }

  console.log("Files copied to", path.join(process.cwd(), "dist"));
}
