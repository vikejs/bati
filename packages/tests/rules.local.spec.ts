import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { combinate } from "@batijs/tests-utils";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { execLocalBati } from "./src/exec-bati.js";

const matrix = combinate([
  ["solid", "react", "vue"],
  ["authjs", "auth0", "drizzle", "telefunc", "trpc", "ts-rest", "postgres"],
]);

matrix.push(["react", "cloudflare", "express"]);
matrix.push(["solid", "cloudflare", "fastify"]);
// PostgreSQL engine conflicts (a server is present, so only the engine conflict can fail)
matrix.push(["react", "postgres", "sqlite", "express"]);
matrix.push(["solid", "postgres", "prisma", "express"]);

function prepareAndExecute(flags: string[]) {
  const context = {
    tmpdir: "",
  };

  // Prepare tests:
  // - Create a temp dir
  beforeAll(async () => {
    context.tmpdir = await mkdtemp(join(tmpdir(), "bati-"));
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

  test(`CLI fails: ${flags.join(",")}`, async () => {
    await expect(execLocalBati(context, flags, false)).rejects.toThrow("Process exited with code 5");
  });

  return {
    context,
  };
}

describe.concurrent.each(matrix)(matrix[0].map(() => "%s").join(" + "), (...currentFlags: string[]) => {
  prepareAndExecute(currentFlags);
});
