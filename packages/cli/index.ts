import { type ArgsDef, type CommandDef, defineCommand, type ParsedArgs, runMain } from "citty";
import exec, { walk } from "@batijs/build";
import packageJson from "./package.json" assert { type: "json" };
import { flags as coreFlags, type Flags, type VikeMeta, withIcon } from "@batijs/core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, parse } from "node:path";
import { access, constants, lstat, readdir, readFile } from "node:fs/promises";
import { blueBright, bold, cyan, gray, green, yellow } from "colorette";
import type { BoilerplateDef, Hook } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function boilerplatesDir() {
  if (existsSync(join(__dirname, "boilerplates", "boilerplates.json"))) {
    return join(__dirname, "boilerplates");
  } else if (existsSync(join(__dirname, "dist", "boilerplates", "boilerplates.json"))) {
    return join(__dirname, "dist", "boilerplates");
  }
  throw new Error("Missing boilerplates.json file. Run `pnpm run build`");
}

async function parseBoilerplates(dir: string): Promise<BoilerplateDef[]> {
  return JSON.parse(await readFile(join(dir, "boilerplates.json"), "utf-8"));
}

function toArg(flag: string | undefined, description: string | undefined): ArgsDef {
  if (!flag) return {};

  return {
    [flag]: {
      type: "boolean",
      required: false,
      description,
    },
  };
}

function findDescription(key: string | undefined, boilerplates: BoilerplateDef[]): string | undefined {
  const bl = boilerplates.find((b) => b.config.flag === key);
  if (!bl) return;

  if (bl.description) {
    return bl.description;
  } else if (bl.config.name && bl.config.homepage) {
    return `Include ${bl.config.name} - ${bl.config.homepage}`;
  } else if (bl.config.name) {
    return `Include ${bl.config.name}`;
  }
}

function printOK(dist: string, flags: string[], boilerplates: BoilerplateDef[]): void {
  const arrow0 = withIcon("→", blueBright);
  const list3 = withIcon("-", undefined, 3);
  const cmd3 = withIcon("$", gray, 3);
  console.log(bold(`${green("✓")} Project created at ${cyan(dist)} with:`));
  console.log(list3(green("Typescript")));
  for (const key of flags) {
    const bl = boilerplates.find((b) => b.config.flag === key);
    if (!bl || !bl.config.name) continue;

    console.log(list3(green(bl.config.name)));
  }

  console.log("\n" + bold(arrow0("Next steps:")));
  console.log(cmd3(`cd ${dist}`));
  console.log(cmd3("pnpm install"));
  console.log(cmd3("pnpm run dev"));
}

const defaultDef = {
  project: {
    type: "positional",
    description: "Project directory",
    required: true,
  },
} as const;

type Args = typeof defaultDef &
  Record<
    Flags,
    {
      type: "boolean";
      required: boolean;
      description: string | undefined;
    }
  >;

export default function yn(value: unknown, default_?: boolean) {
  if (value === undefined || value === null) {
    return default_;
  }

  value = String(value).trim();

  if (/^(?:y|yes|true|1|on)$/i.test(value as string)) {
    return true;
  }

  if (/^(?:n|no|false|0|off)$/i.test(value as string)) {
    return false;
  }

  return default_;
}

async function checkArguments(args: ParsedArgs<Args>) {
  if (existsSync(args.project)) {
    // is target a directory
    const stat = await lstat(args.project);
    if (!stat.isDirectory()) {
      console.error(
        `${yellow("⚠")} Target ${cyan(args.project)} already exists but is not a directory. ${yellow("Aborting")}.`
      );
      process.exit(2);
    }

    // is target a writable directory
    try {
      await access(args.project, constants.W_OK);
    } catch (_) {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(args.project)} already exists but is not writable. ${yellow("Aborting")}.`
      );
      process.exit(3);
    }

    // is target an empty directory
    if ((await readdir(args.project)).length > 0) {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(
          args.project
        )} already exists and is not empty.\n  Continuing might erase existing files. ${yellow("Aborting")}.`
      );
      process.exit(4);
    }
  }
}

async function retrieveHooks(hooks: string[]): Promise<Map<string, Hook[]>> {
  const map = new Map<string, Hook[]>();
  for (const hook of hooks) {
    for await (const file of walk(hook)) {
      const parsed = parse(file);

      switch (parsed.name) {
        case "cli":
          if (!map.has("cli")) {
            map.set("cli", []);
          }
          map.get("cli")!.push((await import(file)).default);
          break;
        default:
          throw new Error(`Unsupported hook ${parsed.name}`);
      }
    }
  }
  return map;
}

async function run() {
  const dir = boilerplatesDir();
  const boilerplates = await parseBoilerplates(dir);

  const main = defineCommand({
    meta: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    },
    args: Object.assign(
      {},
      defaultDef,
      ...Array.from(coreFlags.keys()).map((k) => toArg(k, findDescription(k, boilerplates)))
    ) as Args,
    async run({ args }) {
      await checkArguments(args);

      const sources: string[] = [];
      const hooks: string[] = [];
      const features: string[] = [];
      const flags = Object.entries(args)
        .filter(([, val]) => val === true)
        .map(([key]) => key);

      // push shared boilerplates first
      for (const bl of boilerplates.filter((b) => !b.config.flag)) {
        if (bl.subfolders.includes("files")) {
          sources.push(join(dir, bl.folder, "files"));
        }
        if (bl.subfolders.includes("hooks")) {
          hooks.push(join(dir, bl.folder, "hooks"));
        }
      }

      for (const bl of boilerplates.filter((b) => Boolean(b.config.flag))) {
        if (flags.includes(bl.config.flag!) && bl.subfolders.includes("files")) {
          sources.push(join(dir, bl.folder, "files"));
        }
        if (bl.subfolders.includes("hooks")) {
          hooks.push(join(dir, bl.folder, "hooks"));
        }
      }

      for (const flag of flags) {
        features.push(coreFlags.get(flag)!);
      }

      const hooksMap = await retrieveHooks(hooks);
      const meta = {
        BATI_MODULES: features as VikeMeta["BATI_MODULES"],
      };

      await exec(
        {
          source: sources,
          dist: args.project,
        },
        meta
      );

      printOK(args.project, flags, boilerplates);

      for (const oncli of hooksMap.get("cli") ?? []) {
        await oncli(meta);
      }
    },
  });

  await runMain(main as CommandDef);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
