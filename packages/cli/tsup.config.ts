import { defineConfig } from "@batijs/tsup";
import packageJson from "./package.json" assert { type: "json" };
import { dirname, join, normalize } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, cp, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { PluginBuild } from "esbuild";
import { consola } from "consola";
import { bold, cyan, yellow, green } from "colorette";
import { features } from "@batijs/core";

interface BatiConfig {
  flag?: string;
  boilerplate?: string;
  features?: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToBeCopied = (readonly [string, any])[];

async function* getBatiPackages(build: PluginBuild) {
  const batiPackages = Object.keys(packageJson.devDependencies).filter((pkg) => pkg.match(/^@batijs\//));

  for (const pkg of batiPackages) {
    const result = await build.resolve(pkg, {
      kind: "import-rule",
      resolveDir: ".",
    });

    if (result.errors.length > 0) {
      throw new Error(`Error occured while trying to load ${pkg}: ${JSON.stringify(result.errors)}`);
    }

    yield result.path;
  }
}

async function* getBatiPackageJson(build: PluginBuild) {
  for await (const path of getBatiPackages(build)) {
    let maxDepth = 10;
    let currentPath = path;

    while (--maxDepth > 0) {
      currentPath = normalize(join(currentPath, "..", "..", "package.json"));

      if (existsSync(currentPath)) {
        const content = JSON.parse(await readFile(currentPath, "utf-8"));
        yield [currentPath, content] as const;
        break;
      }
    }
  }
}

async function boilerplateFilesToCopy(build: PluginBuild) {
  const arr: ToBeCopied = [];
  const usedFlags = new Set<string>();
  for await (const [filepath, packageJson] of getBatiPackageJson(build)) {
    assertBatiConfig(packageJson, filepath, usedFlags);
    if (packageJson.bati?.boilerplate) {
      arr.push([packageJson.name, join(dirname(filepath), packageJson.bati?.boilerplate)] as const);
    }
  }
  return arr;
}

function assertBatiConfig(
  packageJson: { bati?: BatiConfig | false; name: string },
  filepath: string,
  usedFlags: Set<string>
) {
  if (packageJson.bati === false) return;
  if (!packageJson.bati) {
    consola.warn(`Missing '${bold("bati")}' property in ${cyan(filepath)}`);
    return;
  }
  const b = packageJson.bati;

  if (typeof b.flag === "string") {
    if (usedFlags.has(b.flag)) {
      throw new Error(`[${packageJson.name}] flag '--${b.flag}' is used by another package`);
    }
    usedFlags.add(b.flag);
  } else if (b.flag) {
    throw new Error(`[${packageJson.name}] 'bati.flag' must be a string`);
  } else if (packageJson.name !== "@batijs/shared") {
    throw new Error(`[${packageJson.name}] 'bati.flag' is missing`);
  }

  if (b.boilerplate && typeof b.boilerplate !== "string") {
    throw new Error(`[${packageJson.name}] 'bati.boilerplate' must be a string`);
  }

  if (b.features) {
    if (!Array.isArray(b.features)) {
      throw new Error(`[${packageJson.name}] 'bati.features' must be an array of string`);
    }

    const unknownFeatures = b.features.filter((f) => !features.includes(f as any));
    if (unknownFeatures.length > 0) {
      throw new Error(`[${packageJson.name}] 'bati.features' has invalid values: ${JSON.stringify(unknownFeatures)}`);
    }
  }
}

async function createBoilerplatesJson(boilerplates: ToBeCopied) {
  const f = join(__dirname, "dist", "boilerplates", "boilerplates.json");

  await writeFile(
    f,
    JSON.stringify(
      boilerplates.reduce(
        (acc, [name]) => {
          acc.sources.push(name);
          return acc;
        },
        { sources: [] as string[] }
      )
    ),
    {
      encoding: "utf-8",
    }
  );

  return stat(f);
}

function readableFileSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = 0;
  while (size >= 1024) {
    size /= 1024;
    ++i;
  }
  return size.toFixed(2) + " " + units[i];
}

// TODO: make a proper plugin in another file
// TODO: actually read boilerplates.json for the cli
export default defineConfig({
  entry: ["index.ts"],
  dts: true,
  outDir: "./dist",
  esbuildPlugins: [
    {
      name: "BLP",
      setup(build) {
        let boilerplates: ToBeCopied;

        build.onStart(async () => {
          boilerplates = await boilerplateFilesToCopy(build);
        });

        build.onEnd(async () => {
          await mkdir(join(__dirname, "dist", "boilerplates"), { recursive: true });

          for (const [name, dir] of boilerplates) {
            const dest = join(__dirname, "dist", "boilerplates", name);
            await cp(dir, dest, {
              dereference: true,
              force: true,
              recursive: true,
            });
          }

          const stats = await createBoilerplatesJson(boilerplates);
          consola.log(
            `${yellow("BLP")} ${join("dist", "boilerplates", "boilerplates.json")} ${green(
              readableFileSize(stats.size)
            )}`
          );
        });
      },
    },
  ],
});
