import { mkdtemp, rm } from "node:fs/promises";
import * as http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { combinate } from "@batijs/tests-utils";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { execLocalBati } from "./src/exec-bati.js";

const matrix = combinate([
  ["solid", "react", "vue"],
  ["authjs", "firebase-auth", "auth0", "drizzle", "telefunc", "trpc", "ts-rest"],
]);

matrix.push(["react", "cloudflare", "express"]);
matrix.push(["solid", "cloudflare", "fastify"]);
matrix.push(["vue", "cloudflare", "h3"]);

function prepareAndExecute(flags: string[]) {
  const context = {
    tmpdir: "",
    localRepository: false,
  };

  // Prepare tests:
  // - Create a temp dir
  beforeAll(async () => {
    context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));

    const isVerdaccioRunning = new Promise<boolean>((resolve) => {
      const req = http.get("http://localhost:4873/registry", {
        timeout: 4000,
      });
      req.on("error", () => resolve(false));
      req.on("close", () => resolve(true));

      req.end();
    });

    context.localRepository = await isVerdaccioRunning;
  }, 5000);

  // Cleanup tests:
  // - Remove temp dir
  afterAll(async () => {
    await Promise.race([
      rm(context.tmpdir, { recursive: true, force: true }),
      new Promise((_resolve, reject) => setTimeout(reject, 5000)),
    ]).catch((e) => {
      console.log("Failed to delete tmpdir in time.");
      throw e;
    });
  }, 5500);

  // Common tests

  test("CLI fails", async () => {
    await expect(execLocalBati(context, flags, false)).rejects.toThrow("Process exited with code 5");
  });

  return {
    context,
  };
}

describe.concurrent.each(matrix)(matrix[0].map(() => "%s").join(" + "), (...currentFlags: string[]) => {
  prepareAndExecute(currentFlags);
});
