import { dirname, join } from "node:path";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Plugin } from "esbuild";
import { bold, cyan, green, yellow } from "colorette";
import { $ } from "execa";
import { flags, which } from "@batijs/core";
import type { BatiConfig, BoilerplateDef, ToBeCopied } from "./types";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PnpmPackageInfo {
  name: string;
  version: string;
  path: string;
  private: boolean;
}

interface SimplePackageJson {
  bati?: BatiConfig | false;
  name: string;
  description?: string;
}

async function getRecursivePackages() {
  const pnpmPath = await which("pnpm");
  const { stdout } = await $`${pnpmPath} m ls --json --depth=-1`;

  return JSON.parse(stdout) as PnpmPackageInfo[];
}

async function getBatiPackages() {
  const batiPackages = (await getRecursivePackages()).filter(
    (pkg) => pkg.name.startsWith("@batijs/") && pkg.path.includes("bati/packages/boilerplates/")
  );

  return batiPackages.map((pkg) => pkg.path);
}

async function* getBatiPackageJson() {
  for (const path of await getBatiPackages()) {
    const currentPath = join(path, "package.json");

    const content = JSON.parse(await readFile(currentPath, "utf-8"));
    yield [currentPath, content] as const;
  }
}

async function boilerplateFilesToCopy() {
  const arr: ToBeCopied[] = [];
  for await (const [filepath, packageJson] of getBatiPackageJson()) {
    assertBatiConfig(packageJson, filepath);

    const subfolders: string[] = [];
    const distFolder = existsSync(join(dirname(filepath), "dist"));
    const hooksFolder = existsSync(join(dirname(filepath), "dist/hooks"));
    const filesFolder = existsSync(join(dirname(filepath), "dist/files"));

    if (filesFolder) {
      subfolders.push("files");
    }

    if (hooksFolder) {
      subfolders.push("hooks");
    }

    arr.push({
      folder: packageJson.name,
      source: distFolder ? join(dirname(filepath), "dist") : undefined,
      config: packageJson.bati,
      description: packageJson.description,
      subfolders,
    });
  }
  return arr;
}

function assertBatiConfig(packageJson: SimplePackageJson, filepath: string) {
  if (packageJson.bati === false) return;
  if (!packageJson.bati) {
    console.warn(`${yellow("WARN")}: Missing '${bold("bati")}' property in ${cyan(filepath)}`);
    return;
  }
  const b = packageJson.bati;

  if (packageJson.name !== "@batijs/shared") {
    if (!b.flag) {
      throw new Error(`[${packageJson.name}] 'bati.flag' is missing`);
    } else if (typeof b.flag !== "string") {
      throw new Error(`[${packageJson.name}] 'bati.flags' must be a string`);
    }
  }

  if (b.flag && !flags.has(b.flag)) {
    throw new Error(`[${packageJson.name}] 'bati.flag' has invalid value: ${b.flag}`);
  }

  if (b.boilerplate && typeof b.boilerplate !== "string") {
    throw new Error(`[${packageJson.name}] 'bati.boilerplate' must be a string`);
  }

  if (b.flag && !b.name) {
    console.warn(`${yellow("WARN")}: Missing '${bold("name")}' property in ${cyan(filepath)}`);
  }

  if (b.flag && !b.homepage) {
    console.warn(`${yellow("WARN")}: Missing '${bold("homepage")}' property in ${cyan(filepath)}`);
  }
}

function formatCopiedToDef(boilerplates: ToBeCopied[]): BoilerplateDef[] {
  return boilerplates.map((bl) => ({
    config: bl.config,
    folder: bl.folder,
    description: bl.description,
    subfolders: bl.subfolders,
  }));
}

async function createBoilerplatesJson(boilerplates: ToBeCopied[]) {
  const f = join(__dirname, "dist", "boilerplates", "boilerplates.json");

  await writeFile(f, JSON.stringify(formatCopiedToDef(boilerplates), undefined, 2), {
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
    build.onEnd(async () => {
      const boilerplates = await boilerplateFilesToCopy();
      const folderCreated = new Set<string>();

      for (const bl of boilerplates) {
        const dest = join(__dirname, "dist", "boilerplates", bl.folder);

        if (!folderCreated.has(dest)) {
          folderCreated.add(dest);
          await mkdir(dest, { recursive: true });
        }

        if (bl.source) {
          await cp(bl.source, dest, {
            dereference: true,
            force: true,
            recursive: true,
          });
        }

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
