import packageJson from "./package.json" assert { type: "json" };
import { dirname, join, normalize } from "node:path";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin, PluginBuild } from "esbuild";
import { bold, cyan, green, yellow } from "colorette";
import type { BatiConfig, BoilerplateDef } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type ToBeCopied = BoilerplateDef[];

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
  for await (const [filepath, packageJson] of getBatiPackageJson(build)) {
    assertBatiConfig(packageJson, filepath);
    if (packageJson.bati?.boilerplate) {
      arr.push({
        folder: packageJson.name,
        source: join(dirname(filepath), packageJson.bati?.boilerplate),
        config: packageJson.bati,
      });
    }
  }
  return arr;
}

function assertBatiConfig(packageJson: { bati?: BatiConfig | false; name: string }, filepath: string) {
  if (packageJson.bati === false) return;
  if (!packageJson.bati) {
    console.warn(`${yellow("WARN")}: Missing '${bold("bati")}' property in ${cyan(filepath)}`);
    return;
  }
  const b = packageJson.bati;

  if (packageJson.name !== "@batijs/shared") {
    if (!b.flags) {
      throw new Error(`[${packageJson.name}] 'bati.flags' is missing`);
    } else if (typeof b.flags !== "object" || Array.isArray(b.flags)) {
      throw new Error(`[${packageJson.name}] 'bati.flags' must be an object`);
    }
  }

  for (const [flag, features] of Object.entries(b.flags ?? {})) {
    if (!Array.isArray(features)) {
      throw new Error(`[${packageJson.name}] 'bati.flags.${flag}' must be an array of string`);
    }

    const unknownFeatures = features.filter((f) => !features.includes(f as any));
    if (unknownFeatures.length > 0) {
      throw new Error(
        `[${packageJson.name}] 'bati.flags.${flag}' has invalid values: ${JSON.stringify(unknownFeatures)}`
      );
    }
  }

  if (b.boilerplate && typeof b.boilerplate !== "string") {
    throw new Error(`[${packageJson.name}] 'bati.boilerplate' must be a string`);
  }
}

async function createBoilerplatesJson(boilerplates: ToBeCopied) {
  const f = join(__dirname, "dist", "boilerplates", "boilerplates.json");

  await writeFile(f, JSON.stringify(boilerplates.map((bl) => ({ config: bl.config, folder: bl.folder }))), {
    encoding: "utf-8",
  });

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

const esbuildPlugin: Plugin = {
  name: "BLP",
  setup(build) {
    let boilerplates: ToBeCopied;

    build.onStart(async () => {
      boilerplates = await boilerplateFilesToCopy(build);
    });

    build.onEnd(async () => {
      await mkdir(join(__dirname, "dist", "boilerplates"), { recursive: true });

      for (const bl of boilerplates) {
        const dest = join(__dirname, "dist", "boilerplates", bl.folder);
        await cp(bl.source, dest, {
          dereference: true,
          force: true,
          recursive: true,
        });
        console.log(`${yellow("BLP")} ${join("dist", "boilerplates")}/${cyan(bl.folder)}`);
      }

      const stats = await createBoilerplatesJson(boilerplates);
      console.log(
        `${yellow("BLP")} ${join("dist", "boilerplates", "boilerplates.json")} ${green(readableFileSize(stats.size))}`
      );
    });
  },
};

export default esbuildPlugin;
