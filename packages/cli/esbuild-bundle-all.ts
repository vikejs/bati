import { existsSync } from "node:fs";
import { cp, mkdir, opendir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, parse, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { which } from "@batijs/core";
import { cyan, green, yellow } from "colorette";
import type { Plugin } from "esbuild";
import { $ } from "execa";
import type { BoilerplateDef, ToBeCopied } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PnpmPackageInfo {
  name: string;
  version: string;
  path: string;
  private: boolean;
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
    const pkgDir = dirname(filepath);

    const batiConfigFile = existsSync(join(pkgDir, "dist", "bati.config.js"));

    if (!batiConfigFile) {
      throw new Error(`Missing 'bati.config.ts' in '${filepath}'`);
    }

    const subfolders: string[] = [];
    const distFolder = existsSync(join(pkgDir, "dist"));
    const hooksFolder = existsSync(join(pkgDir, "dist", "hooks"));
    const filesFolder = existsSync(join(pkgDir, "dist", "files"));

    if (filesFolder) {
      subfolders.push("files");
    }

    if (hooksFolder) {
      subfolders.push("hooks");
    }

    arr.push({
      folder: packageJson.name,
      source: distFolder ? join(pkgDir, "dist") : undefined,
      subfolders,
    });
  }
  return arr;
}

function formatCopiedToDef(boilerplates: ToBeCopied[]): BoilerplateDef[] {
  return boilerplates.map((bl) => ({
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
  return `${size.toFixed(2)} ${units[i]}`;
}

export async function* yield$files(dir: string): AsyncGenerator<{ dir: string; name: string }> {
  if (!existsSync(dir)) return;
  for await (const d of await opendir(dir)) {
    const entry = join(dir, d.name);
    if (d.isDirectory()) {
      yield* yield$files(entry);
    } else if (d.isFile() && d.name.startsWith("$"))
      yield {
        dir,
        name: d.name,
      };
  }
}

// TODO: assert all rules messages are implemented
const esbuildPlugin: Plugin = {
  name: "BLP",
  async setup(build) {
    const boilerplates = await boilerplateFilesToCopy();

    for (const bl of boilerplates) {
      if (bl.source) {
        for await (const { dir, name } of yield$files(bl.source)) {
          (build.initialOptions.entryPoints as Record<string, string>)[
            join("boilerplates", bl.folder, relative(bl.source, dir), parse(name).name)
          ] = join(dir, name);
        }
      }
    }

    build.onEnd(async () => {
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
            filter(source) {
              return !basename(source).startsWith("$");
            },
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
