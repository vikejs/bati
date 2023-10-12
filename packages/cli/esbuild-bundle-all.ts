import { existsSync } from "node:fs";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { which } from "@batijs/core";
import { bold, cyan, green, yellow } from "colorette";
import type { Plugin } from "esbuild";
import { $ } from "execa";
import type { BatiConfig, BoilerplateDef, ToBeCopied } from "./types.js";

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
}

async function getRecursivePackages() {
  const pnpmPath = await which("pnpm");
  const { stdout } = await $`${pnpmPath} m ls --json --depth=-1`;

  return JSON.parse(stdout) as PnpmPackageInfo[];
}

async function getBatiPackages() {
  const batiPackages = (await getRecursivePackages()).filter(
    (pkg) => pkg.name.startsWith("@batijs/") && pkg.path.includes("boilerplates"),
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
    const hooksFolder = existsSync(join(dirname(filepath), "dist", "hooks"));
    const filesFolder = existsSync(join(dirname(filepath), "dist", "files"));

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
}

function formatCopiedToDef(boilerplates: ToBeCopied[]): BoilerplateDef[] {
  return boilerplates.map((bl) => ({
    config: bl.config,
    folder: bl.folder,
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

// TODO: assert all rules messages are implemented
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
        `${yellow("BLP")} ${join("dist", "boilerplates", "boilerplates.json")} ${green(readableFileSize(stats.size))}`,
      );
    });
  },
};

export default esbuildPlugin;
