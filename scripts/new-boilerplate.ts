import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "citty";
import sharedPackageJson from "../boilerplates/shared/package.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __boilerplates = resolve(__dirname, "..", "boilerplates");

const validNameRe = /[a-z0-9-.]/;

async function createFolders(name: string) {
  const root = join(__boilerplates, name);

  await mkdir(join(__boilerplates, name));
  await mkdir(join(root, "files"));

  return root;
}

async function createPackageJson(name: string) {
  const dest = join(__boilerplates, name, "package.json");

  const json = {
    name: "@batijs/" + name,
    private: true,
    version: "0.0.1",
    description: "",
    type: "module",
    scripts: {
      "check-types": "tsc --noEmit",
      build: "bati-compile-boilerplate",
    },
    keywords: [],
    author: "",
    license: "MIT",
    devDependencies: {
      "@batijs/compile": "workspace:*",
      "@types/node": sharedPackageJson.devDependencies["@types/node"],
    },
    dependencies: {
      "@batijs/core": "workspace:*",
    },
    files: ["dist/"],
    bati: {
      if: {
        flag: name,
      },
    },
  };

  await writeFile(dest, JSON.stringify(json, undefined, 2), "utf-8");
}

async function createTsconfig(name: string) {
  const dest = join(__boilerplates, name, "tsconfig.json");

  const json = {
    extends: ["../tsconfig.base.json"],
  };

  await writeFile(dest, JSON.stringify(json, undefined, 2), "utf-8");
}

async function exec(name: string) {
  const root = await createFolders(name);

  await createPackageJson(name);
  await createTsconfig(name);

  return root;
}

const main = defineCommand({
  meta: {
    name: "new-boilerplate",
    version: "1.0.0",
    description: "Create a new Bati boilerplate",
  },
  args: {
    name: {
      type: "positional",
      required: true,
    },
  },
  async run({ args }) {
    if (!validNameRe.test(args.name)) {
      throw new Error("Invalid boilerplates name");
    }

    const root = await exec(args.name);
    console.log("Boilerplate created at", root);
  },
});

runMain(main);
