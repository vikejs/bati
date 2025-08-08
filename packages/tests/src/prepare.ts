import { readdirSync } from "node:fs";
import mri from "mri";
import {
  createBatiConfig,
  createKnipConfig,
  createTurboConfig,
  updatePackageJson,
  updateTsconfig,
  updateVitestConfig,
} from "./common.js";

async function prepare(flags: string[], testFiles: string) {
  const projectDir = ".";
  const packedTestUtils = readdirSync(projectDir).find((f) => f.startsWith("batijs-tests-utils-"));

  if (!packedTestUtils) {
    throw new Error("No packed test utils found.");
  }

  // @ts-ignore
  const packageJson = await updatePackageJson(projectDir, `./${packedTestUtils}`, `bun@${Bun.version}`, true);
  await updateTsconfig(projectDir);
  await updateVitestConfig(projectDir, testFiles);
  await createTurboConfig({
    tmpdir: projectDir,
  });
  await createKnipConfig(projectDir, flags, packageJson.scripts);
  await createBatiConfig(projectDir, flags);
}

const argv = process.argv.slice(2);
const args = mri<Record<string, unknown>>(argv);
const flags: string[] = [];

for (const [k, v] of Object.entries(args)) {
  if (v === true) {
    flags.push(k);
  }
}

await prepare(flags, args["test-files"] as string);
