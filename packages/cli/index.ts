import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { access, constants, lstat, readdir, readFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import exec, { walk } from "@batijs/build";
import { packageManager, type VikeMeta, which, withIcon } from "@batijs/core";
import { BatiSet, type CategoryLabels, cliFlags, type Feature, type Flags, features } from "@batijs/features";
import { execRules } from "@batijs/features/rules";
import { select } from "@inquirer/prompts";
import { type ArgsDef, type CommandDef, defineCommand, type ParsedArgs, runMain } from "citty";
import { blue, blueBright, bold, cyan, gray, green, red, underline, yellow } from "colorette";
import sift from "sift";
import packageJson from "./package.json" with { type: "json" };
import { type RuleMessage, rulesMessages } from "./rules.js";
import type { BoilerplateDef, Hook } from "./types.js";

printInit();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";
const pm = packageManager();

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

function printInit() {
  console.log(cyan("\n🔨 Vike Scaffolder 🔨\n"));
}
function printOK(dist: string, flags: string[]): void {
  const indent = 1;
  const list3 = withIcon("-", gray, indent);
  const cmd3 = withIcon("$", gray, indent);
  console.log(`${green(`${bold("✓")} Project created: ${bold(dist)}`)}`);
  console.log(list3("Vike"));
  for (const key of flags) {
    const feature = features.find((f) => f.flag === key);
    if (!feature || !feature.label) continue;

    console.log(list3(feature.label));
  }

  console.log(`\n${bold("Next steps:")}`);
  console.log(cmd3(`cd ${dist}`));

  switch (pm?.name) {
    case "bun": {
      console.log(cmd3("bun install"));
      console.log(cmd3("bun run dev"));
      break;
    }
    case "yarn": {
      console.log(cmd3("yarn install"));
      console.log(cmd3("yarn run dev"));
      break;
    }
    case "npm": {
      console.log(cmd3("npm install"));
      console.log(cmd3("npm run dev"));
      break;
    }
    default: {
      console.log(cmd3("pnpm install"));
      console.log(cmd3("pnpm run dev"));
      break;
    }
  }

  // TODO: show this log if there are remaining steps
  console.log(withIcon("-", gray, indent)(`Check README.md for final steps`));

  console.log("\nHappy coding! 🚀\n");
}

const defaultDef = {
  project: {
    type: "positional",
    description: "Project directory",
    required: false,
  },
  force: {
    type: "boolean",
    description: "If true, does no check if target directory already exists",
    required: false,
  },
  "skip-git": {
    type: "boolean",
    description: "If true, does not execute `git init`",
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

function generateRandomFilename(size: number) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < size; i++) {
    // Pick a random character from the string and add it to the result
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

async function checkArguments(args: ParsedArgs<Args>) {
  const projectChosenByUser = Boolean(args.project);
  if (!args.project) {
    // Try to default to `my-app`, otherwise `my-app[randomString]`
    args.project = "my-app";
  }

  if (existsSync(args.project)) {
    // is target a directory
    const stat = await lstat(args.project);
    if (!projectChosenByUser) {
      args.project = `my-app-${generateRandomFilename(5)}`;
      return;
    } else if (!stat.isDirectory()) {
      console.error(
        `${yellow("⚠")} Target ${cyan(args.project)} already exists but is not a directory. ${yellow("Aborting")}.`,
      );
      process.exit(2);
    }

    // is target a writable directory
    try {
      await access(args.project, constants.W_OK);
    } catch {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(args.project)} already exists but is not writable. ${yellow("Aborting")}.`,
      );
      process.exit(3);
    }

    // is target an empty directory
    if (!args.force) {
      const isFolderEmpty = (await readdir(args.project)).length === 0;

      if (!isFolderEmpty) {
        if (!projectChosenByUser) {
          args.project = `my-app-${generateRandomFilename(5)}`;
          return;
        } else {
          console.error(
            `${yellow("⚠")} Target folder ${cyan(
              args.project,
            )} already exists and is not empty.\n  Continuing might erase existing files. ${yellow("Aborting")}.`,
          );
          process.exit(4);
        }
      }
    }
  }
}

const choices = [
  {
    label: "React",
    value: "react",
    labelColor: cyan,
  },
  {
    label: "Vue",
    value: "vue",
    labelColor: green,
  },
  {
    label: "SolidJS",
    value: "solid",
    labelColor: blue,
  },
];

function colorFirstLetter(choice: (typeof choices)[number]) {
  return choice.labelColor(choice.label[0]) + choice.label.substring(1);
}

async function checkFlagsIncludesUiFramework(flags: string[]) {
  const uiFlags: string[] = features.filter((fs) => fs.category === "UI Framework").map((fs) => fs.flag);
  const uiFlagFound = flags.some((f) => uiFlags.includes(f));

  if (!uiFlagFound) {
    console.warn(
      `${yellow("🛈 You are scaffolding a barebone app.")} Go to ${underline("https://vike.dev/new")} to scaffold a full-fledged app with tools such as Tailwind, authentication, RPC, database, deployment, ...\n`,
    );
    const ui = await select({
      theme: {
        style: {
          highlight(t: string) {
            const found = choices.find((c) => t.includes(colorFirstLetter(c)));
            return (found?.labelColor ?? cyan)(t);
          },
        },
      },
      message: "Select a framework:",
      choices: choices.map((c) => ({
        name: colorFirstLetter(c),
        value: c.value,
      })),
    });
    flags.unshift(ui);
  }
}

function checkFlagsExist(flags: string[]) {
  const inValidOptions = flags.reduce((acc: string[], flag: string) => {
    if (!Object.hasOwn(defaultDef, flag) && !features.some((f) => f.flag === flag)) {
      acc.push(flag);
    }
    return acc;
  }, []);
  const count = inValidOptions.length;
  if (count) {
    console.error(
      `${red("⚠")} Unknown option${count > 1 ? "s" : ""} ${bold(inValidOptions.join(", "))}. Use \`--help\` to list all available options.`,
    );
    process.exit(5);
  }
}

function checkRules(flags: string[]) {
  const potentialRulesMessages = execRules(flags as FeatureOrCategory[], rulesMessages);

  const infos = potentialRulesMessages.filter((m): m is RuleMessage => m?.type === "info");
  const warnings = potentialRulesMessages.filter((m): m is RuleMessage => m?.type === "warning");
  const errors = potentialRulesMessages.filter((m): m is RuleMessage => m?.type === "error");

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
      const importFile = isWin ? `file://${file}` : file;

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
    return (sift as unknown as typeof sift.default)(bl.config.if)(
      flags.map((f) => ({ flag: f, packageManager: pm?.name })),
    );
  }

  // No condition means always true
  return true;
}

function gitInit(cwd: string) {
  const exists = which("git");
  if (!exists) return;

  try {
    execSync("git init", {
      cwd,
      stdio: "ignore",
    });

    execSync("git add .", { cwd, stdio: "ignore" });
    execSync(
      [
        "git",
        '-c user.name="Bati"',
        '-c user.email="no-reply@batijs.dev"',
        "commit",
        "--no-gpg-sign",
        '--message="scaffold Vike app with Bati"',
      ].join(" "),
      { cwd, stdio: "ignore" },
    );
  } catch {
    try {
      rmSync(join(cwd, ".git"), { recursive: true, force: true });
    } catch {
      /* empty */
    }

    console.warn(`${yellow("⚠")} failed to initialize a git repository in destination folder. Skipping.`);
  }
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
      const flags = [
        ...new Set(
          Object.entries(args)
            .filter(([, val]) => val === true)
            .flatMap(([key]) => {
              const flag: string[] = [key];
              const dependsOn = (features as ReadonlyArray<Feature>).find((f) => f.flag === key)?.dependsOn;

              if (dependsOn) {
                flag.push(...dependsOn);
              }
              return flag;
            }),
        ),
      ];

      checkFlagsExist(flags);
      await checkFlagsIncludesUiFramework(flags);
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
        BATI: new BatiSet(flags as Flags[], features),
        BATI_TEST: Boolean(process.env.BATI_TEST),
      };

      await exec(
        {
          source: sources,
          dist: args.project,
        },
        meta,
      );

      for (const onafter of hooksMap.get("after") ?? []) {
        await onafter(args.project, meta);
      }

      if (!args["skip-git"]) {
        gitInit(args.project);
      }

      printOK(args.project, flags);
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
