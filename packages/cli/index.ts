import { existsSync } from "node:fs";
import { access, constants, lstat, readdir, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import exec, { walk } from "@batijs/build";
import { withIcon, type VikeMeta } from "@batijs/core";
import { cliFlags, features, type CategoryLabels, type Feature, type Flags } from "@batijs/features";
import { execRules } from "@batijs/features/rules";
import { defineCommand, runMain, type ArgsDef, type CommandDef, type ParsedArgs } from "citty";
import { blueBright, bold, cyan, gray, green, red, yellow } from "colorette";
import sift from "sift";
import packageJson from "./package.json";
import { rulesMessages } from "./rules.js";
import type { BoilerplateDef, Hook } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";

type FeatureOrCategory = Flags | CategoryLabels;

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

function findDescription(key: string | undefined): string | undefined {
  const feat: Feature | undefined = features.find((f) => f.flag === key);
  if (!feat) return;

  if (feat.description) {
    return feat.description;
  } else if (feat.label && feat.url) {
    return `Include ${feat.label} - ${feat.url}`;
  } else if (feat.label) {
    return `Include ${feat.label}`;
  }
}

function printOK(dist: string, flags: string[]): void {
  const arrow0 = withIcon("→", blueBright);
  const book0 = withIcon("📚", blueBright);
  const list3 = withIcon("-", undefined, 3);
  const cmd3 = withIcon("$", gray, 3);
  console.log(bold(`${green("✓")} Project created at ${cyan(dist)} with:`));
  console.log(list3(green("Vike")));
  for (const key of flags) {
    const feature = features.find((f) => f.flag === key);
    if (!feature || !feature.label) continue;

    console.log(list3(green(feature.label)));
  }

  console.log("\n" + bold(arrow0("Ready to start you app:")));
  console.log(cmd3(`cd ${dist}`));
  console.log(cmd3("pnpm install"));
  console.log(cmd3("pnpm run dev"));

  console.log(
    "\n" + bold(book0("Be sure to check the ") + cyan("README.md") + " file for remaining steps and documentation."),
  );
}

const defaultDef = {
  project: {
    type: "positional",
    description: "Project directory",
    required: false,
    default: "my-app",
  },
  force: {
    type: "boolean",
    description: "If true, does no check if target directory already exists",
    required: false,
  },
} as const satisfies ArgsDef;

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
        `${yellow("⚠")} Target ${cyan(args.project)} already exists but is not a directory. ${yellow("Aborting")}.`,
      );
      process.exit(2);
    }

    // is target a writable directory
    try {
      await access(args.project, constants.W_OK);
    } catch (_) {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(args.project)} already exists but is not writable. ${yellow(
          "Aborting",
        )}.`,
      );
      process.exit(3);
    }

    // is target an empty directory
    if (!args.force && (await readdir(args.project)).length > 0) {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(
          args.project,
        )} already exists and is not empty.\n  Continuing might erase existing files. ${yellow("Aborting")}.`,
      );
      process.exit(4);
    }
  }
}

function checkRules(flags: string[]) {
  const potentialRulesMessages = execRules(flags as FeatureOrCategory[], rulesMessages);

  const infos = potentialRulesMessages.filter((m) => m.type === "info");
  const warnings = potentialRulesMessages.filter((m) => m.type === "warning");
  const errors = potentialRulesMessages.filter((m) => m.type === "error");

  if (infos.length > 0) {
    infos.forEach((m) => {
      console.info(blueBright(`ℹ ${m.value}.`));
    });

    console.log("");
  }

  if (warnings.length > 0) {
    warnings.forEach((m) => {
      console.warn(yellow(`⚠ ${m.value}.`));
    });

    console.log("");
  }

  if (errors.length > 0) {
    errors.forEach((m) => {
      console.error(red(`⚠ ${m.value}.`));
    });

    console.log("");
    process.exit(5);
  }
}

async function retrieveHooks(hooks: string[]): Promise<Map<"after", Hook[]>> {
  const map = new Map<"after", Hook[]>();
  for (const hook of hooks) {
    for await (const file of walk(hook)) {
      const parsed = parse(file);
      const importFile = isWin ? "file://" + file : file;

      switch (parsed.name) {
        case "after":
          if (!map.has("after")) {
            map.set("after", []);
          }
          map.get("after")!.push((await import(importFile)).default);
          break;
        default:
          throw new Error(`Unsupported hook ${parsed.name}`);
      }
    }
  }
  return map;
}

function testFlags(flags: string[], bl: BoilerplateDef) {
  if (bl.config.if) {
    return (sift as unknown as typeof sift.default)(bl.config.if)(flags.map((f) => ({ flag: f })));
  }

  // No condition means always
  return true;
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
    args: Object.assign({}, defaultDef, ...cliFlags.map((k) => toArg(k, findDescription(k)))) as Args,
    async run({ args }) {
      await checkArguments(args);

      const sources: string[] = [];
      const hooks: string[] = [];
      const flags = Object.entries(args)
        .filter(([, val]) => val === true)
        .map(([key]) => {
          const flag: string[] = [key];
          const dependsOn = (features as ReadonlyArray<Feature>).find((f) => f.flag === key)?.dependsOn;

          if (dependsOn) {
            flag.push(...dependsOn);
          }
          return flag;
        })
        .flat(1);

      checkRules(flags);

      // `enforce: "pre"` boilerplates first, then `enforce: undefined`, then `enforce: "post"`
      boilerplates.sort((b1, b2) => {
        if (b1.config.enforce === "pre") return -1;
        if (b1.config.enforce === "post") return 1;
        if (b2.config.enforce === "pre") return 1;
        if (b2.config.enforce === "post") return -1;
        return 0;
      });

      for (const bl of boilerplates) {
        if (testFlags(flags, bl)) {
          if (bl.subfolders.includes("files")) {
            sources.push(join(dir, bl.folder, "files"));
          }
          if (bl.subfolders.includes("hooks")) {
            hooks.push(join(dir, bl.folder, "hooks"));
          }
        }
      }

      const hooksMap = await retrieveHooks(hooks);
      const meta: VikeMeta = {
        BATI: new Set(flags as Flags[]),
      };

      await exec(
        {
          source: sources,
          dist: args.project,
        },
        meta,
      );

      printOK(args.project, flags);

      for (const onafter of hooksMap.get("after") ?? []) {
        await onafter(meta);
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
