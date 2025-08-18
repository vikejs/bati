import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import * as process from "node:process";
import tsc from "tsc-prog";

// Inspired by https://github.com/nodejs/node/issues/8033#issuecomment-388323687
function overrideStderr() {
  const originalStdoutWrite = process.stderr.write.bind(process.stderr);

  let activeIntercept = false;
  let taskOutput: string = "";

  process.stderr.write = (chunk) => {
    if (activeIntercept && typeof chunk === "string") {
      taskOutput += chunk;
    }

    return true;
  };

  activeIntercept = true;

  return {
    flush() {
      const result = taskOutput;

      activeIntercept = false;
      taskOutput = "";

      return result;
    },
    restore() {
      process.stderr.write = originalStdoutWrite;
    },
  };
}

export async function buildTypes() {
  const { flush, restore } = overrideStderr();

  const program = tsc.createProgramFromConfig({
    basePath: process.cwd(),
    configFilePath: "tsconfig.json",
    compilerOptions: {
      rootDir: "./files",
      noEmit: false,
      outDir: "./dist/types",
      declaration: true,
      emitDeclarationOnly: true,
      sourceMap: false,
      listEmittedFiles: true,
    },
    include: ["files/**/*"],
    exclude: ["files/**/$*"],
  });

  restore();

  const errors = flush()
    .split("\n")
    .filter((l) => !l.match(/\s*/))
    // TS18003 means no files to compile, but we do not consider that an error in our case
    .filter((l) => !l.includes("TS18003"));

  if (errors.length) {
    errors.forEach((l) => {
      console.error(l);
    });
    return process.exit(1);
  }

  const { diagnostics, emitSkipped, emittedFiles } = program.emit();

  if (diagnostics.length) {
    diagnostics.forEach((d) => {
      console.error(`${d.file}:${d.start} ${d.messageText}`);
    });
    return process.exit(1);
  }

  if (emitSkipped) process.exit(1);

  if (emittedFiles?.length) {
    const distTypes = path.join(process.cwd(), "dist", "types");
    const relFiles = emittedFiles.map((f) => path.relative(distTypes, f).replace(/\\/g, "/"));

    const packageJsonTypes = relFiles.reduce(
      (acc, cur) => {
        acc.exports[`./${cur.slice(0, -".d.ts".length)}`] = {
          types: `./dist/types/${cur}`,
        };
        acc.typesVersions["*"][`${cur.slice(0, -".d.ts".length)}`] = [`./dist/types/${cur}`];
        return acc;
      },
      {
        exports: {} as Record<string, { types: string }>,
        typesVersions: { "*": {} } as Record<"*", Record<string, string[]>>,
      },
    );

    const packageJson = JSON.parse(await readFile("package.json", "utf-8"));

    packageJson.exports = packageJsonTypes.exports;
    packageJson.typesVersions = packageJsonTypes.typesVersions;

    await writeFile("package.json", JSON.stringify(packageJson, undefined, 2).replace(/\r\n/g, "\n"), "utf-8");
    console.log("Types generated into", distTypes);
  }
}
