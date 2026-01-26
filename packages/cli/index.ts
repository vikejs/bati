import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { access, constants, lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import exec, { walk } from "@batijs/build";
import { getVersion, packageManager, type VikeMeta, which, withIcon } from "@batijs/core";
import type { BatiConfig, BatiConfigStep, BatiKnipConfig } from "@batijs/core/config";
import { BatiSet, type CategoryLabels, cliFlags, type Feature, type Flags, features } from "@batijs/features";
import { execRules } from "@batijs/features/rules";
import { select } from "@inquirer/prompts";
import { type ArgDef, type CommandDef, defineCommand, type ParsedArgs, runMain, showUsage } from "citty";
import * as colorette from "colorette";
import { blue, blueBright, bold, cyan, gray, green, red, underline, yellow } from "colorette";
import { kebabCase } from "scule";
import packageJson from "./package.json" with { type: "json" };
import { type RuleMessage, rulesMessages } from "./rules.js";
import type { BoilerplateDef, BoilerplateDefWithConfig, Hook } from "./types.js";

printInit();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isWin = process.platform === "win32";
const pm = packageManager();

type FeatureOrCategory = Flags | CategoryLabels;
type BatiArgDef = ArgDef & { invisible?: boolean };
type BatiArgsDef = Record<string, BatiArgDef>;

function boilerplatesDir() {
  if (existsSync(join(__dirname, "boilerplates", "boilerplates.json"))) {
    return join(__dirname, "boilerplates");
  } else if (existsSync(join(__dirname, "dist", "boilerplates", "boilerplates.json"))) {
    return join(__dirname, "dist", "boilerplates");
  }
  throw new Error("Missing boilerplates.json file. Run `pnpm run build`");
}

async function loadBoilerplates(dir: string): Promise<BoilerplateDefWithConfig[]> {
  const boilerplates: BoilerplateDef[] = JSON.parse(await readFile(join(dir, "boilerplates.json"), "utf-8"));

  return await Promise.all(
    boilerplates.map(async (bl) => {
      const batiConfigFile = join(dir, bl.folder, "bati.config.js");
      const importFile = isWin ? `file://${batiConfigFile}` : batiConfigFile;
      const { default: batiConfig }: { default: BatiConfig } = await import(importFile);
      return {
        ...bl,
        config: batiConfig,
      };
    }),
  );
}

function toArg(flag: string | undefined, feature: Feature | undefined): BatiArgsDef {
  if (!flag) return {};

  return {
    [flag]: {
      type: "boolean",
      required: false,
      description: feature?.description,
      invisible: feature?.disabled,
    },
  };
}

async function generateKnipConfig(dist: string, boilerplates: BoilerplateDefWithConfig[]): Promise<void> {
  const aggregated: Required<BatiKnipConfig> = {
    entry: [],
    ignore: [],
    ignoreDependencies: [],
    vite: true,
  };

  for (const bl of boilerplates) {
    if (bl.config.knip) {
      if (bl.config.knip.entry) {
        aggregated.entry.push(...bl.config.knip.entry);
      }
      if (bl.config.knip.ignore) {
        aggregated.ignore.push(...bl.config.knip.ignore);
      }
      if (bl.config.knip.ignoreDependencies) {
        aggregated.ignoreDependencies.push(...bl.config.knip.ignoreDependencies);
      }
      if (bl.config.knip.vite === false) {
        aggregated.vite = false;
      }
    }
  }

  // Add dynamic script-based dependencies from the generated package.json
  try {
    const pkgJsonPath = join(dist, "package.json");
    const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
    const scriptsValues = Object.values(pkgJson.scripts ?? {}) as string[];

    if (scriptsValues.some((s) => s.includes("tsx "))) {
      aggregated.ignoreDependencies.push("tsx");
    }

    if (scriptsValues.some((s) => s.includes("cross-env "))) {
      aggregated.ignoreDependencies.push("cross-env");
    }
  } catch {
    // package.json might not exist yet, skip script-based checks
  }

  await writeFile(
    join(dist, "knip.json"),
    JSON.stringify(
      {
        $schema: "https://unpkg.com/knip@5/schema.json",
        entry: aggregated.entry,
        ignore: aggregated.ignore,
        ignoreDependencies: aggregated.ignoreDependencies,
        rules: {
          types: "off",
          binaries: "off",
          exports: "off",
        },
        vite: aggregated.vite,
      },
      undefined,
      2,
    ),
    "utf-8",
  );
}

function findFeature(key: string | undefined): Feature | undefined {
  const feat: Feature | undefined = features.find((f) => f.flag === key);
  if (!feat) return;

  if (feat.description) {
    return feat;
  } else if (feat.label && feat.url) {
    return { ...feat, description: `Include ${feat.label} - ${feat.url}` };
  } else if (feat.label) {
    return { ...feat, description: `Include ${feat.label}` };
  }
  return feat;
}

async function hasRemainingSteps(dist: string) {
  try {
    await access(join(dist, "TODO.md"));
    return true;
  } catch {
    return false;
  }
}

function printInit() {
  const v = getVersion();
  const version = v.semver.at(-1);
  assert(version);
  console.log(`\n🔨 ${cyan("Vike Scaffolder")} 🔨 ${gray(`v${version}`)}\n`);
}

async function printOK(dist: string, flags: string[], nextSteps: BatiConfigStep[]) {
  const indent = 1;
  const list = withIcon("-", gray, indent);
  const cmd = withIcon("$", gray, indent);
  const distPretty = prettifyDist(dist);
  console.log(`${green(`${bold("✓")} Project created: ${bold(distPretty)}`)}`);
  console.log(list("Vike"));
  for (const key of flags) {
    const feature = features.find((f) => f.flag === key);
    if (!feature || !feature.label) continue;

    console.log(list(feature.label));
  }

  console.log(`\n${bold("Next steps:")}`);
  // Step 1
  console.log(cmd(`cd ${distPretty}`));
  // Step 2
  console.log(cmd(`${pm.name} install`));
  // Step 3
  if (nextSteps.length > 0) {
    for (const step of nextSteps) {
      if (step.type === "command") {
        console.log(cmd(step.step));
      } else {
        console.log(withIcon("•️", gray, indent)(step.step));
      }
    }
  } else if (await hasRemainingSteps(dist)) {
    console.log(withIcon("•️", gray, indent)(`Check ${bold("TODO.md")} for remaining steps`));
  }
  // Step 4
  console.log(cmd(`${pm.run} dev`));

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
  knip: {
    type: "boolean",
    // Hidden flag used by E2E tests to generate knip.json during scaffolding
    invisible: true,
    required: false,
  },
} as const satisfies BatiArgsDef;

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

async function checkArguments(args: ParsedArgs<Args>): Promise<
  ParsedArgs<
    Omit<Args, "project"> & {
      project: {
        type: "positional";
        description: "Project directory";
        required: true;
      };
    }
  >
> {
  const projectChosenByUser = Boolean(args.project);
  const newArgs = {
    ...args,
  };
  if (!newArgs.project) {
    // Try to default to `my-app`, otherwise `my-app[randomString]`
    newArgs.project = "my-app";
  }

  if (existsSync(newArgs.project)) {
    // is target a directory
    const stat = await lstat(newArgs.project);
    if (!projectChosenByUser) {
      newArgs.project = `my-app-${generateRandomFilename(5)}`;
      // biome-ignore lint/suspicious/noExplicitAny: ok
      return newArgs as any;
    } else if (!stat.isDirectory()) {
      console.error(
        `${yellow("⚠")} Target ${cyan(newArgs.project)} already exists but is not a directory. ${yellow("Aborting")}.`,
      );
      process.exit(2);
    }

    // is target a writable directory
    try {
      await access(newArgs.project, constants.W_OK);
    } catch {
      console.error(
        `${yellow("⚠")} Target folder ${cyan(newArgs.project)} already exists but is not writable. ${yellow("Aborting")}.`,
      );
      process.exit(3);
    }

    // is target an empty directory
    if (!newArgs.force) {
      const isFolderEmpty = (await readdir(newArgs.project)).length === 0;

      if (!isFolderEmpty) {
        if (!projectChosenByUser) {
          newArgs.project = `my-app-${generateRandomFilename(5)}`;
          // biome-ignore lint/suspicious/noExplicitAny: ok
          return newArgs as any;
        } else {
          console.error(
            `${yellow("⚠")} Target folder ${cyan(
              newArgs.project,
            )} already exists and is not empty.\n  Continuing might erase existing files. ${yellow("Aborting")}.`,
          );
          process.exit(4);
        }
      }
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: ok
  return newArgs as any;
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
    label: "Solid",
    value: "solid",
    labelColor: blue,
  },
];

async function checkFlagsIncludesUiFramework(flags: string[]) {
  const flagsUi: string[] = features.filter((fs) => fs.category === "UI Framework").map((fs) => fs.flag);
  const flagsHosting: string[] = features.filter((fs) => fs.category === "Hosting").map((fs) => fs.flag);
  const flagsUiFound = flags.some((f) => flagsUi.includes(f));
  const isBarebones = flags.filter((f) => !flagsUi.includes(f) && !flagsHosting.includes(f)).length === 0;

  if (isBarebones) {
    console.warn(
      `${yellow("🛈 Scaffolding a bare-bones app")} ➡️  Go to ${underline("https://vike.dev/new")} to scaffold full-fledged apps with Tailwind, authentication, database, deployment, and more.\n`,
    );
  }
  if (!flagsUiFound) {
    const ui = await select({
      theme: {
        style: {
          highlight(t: string) {
            const found = choices.find((c) => t.includes(c.label));
            return (found?.labelColor ?? cyan)(t);
          },
        },
      },
      message: "Select a UI framework:",
      choices: choices.map((c) => ({
        name: c.label,
        value: c.value,
      })),
    });
    flags.unshift(ui);
  }
}

function checkFlagsExist(flags: string[]) {
  const inValidOptions = flags.reduce((acc: string[], flag: string) => {
    if (
      !Object.hasOwn(defaultDef, flag) &&
      !features.some((f) => f.flag === flag || kebabCase(f.flag) === kebabCase(flag))
    ) {
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

function testFlags(meta: VikeMeta, bl: BoilerplateDefWithConfig) {
  if (bl.config.if) {
    return bl.config.if(meta, pm.name);
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
  const boilerplates = await loadBoilerplates(dir);

  const optsArgs = Object.assign({}, defaultDef, ...cliFlags.map((k) => toArg(k, findFeature(k)))) as Args;

  const main = defineCommand({
    meta: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
    },
    args: optsArgs,
    async run(commandContext) {
      const args = await checkArguments(commandContext.args);

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

      const meta: VikeMeta = {
        BATI: new BatiSet(flags as Flags[], features),
        BATI_TEST: Boolean(process.env.BATI_TEST),
        BATI_SKIP_GIT: args["skip-git"],
        BATI_IS_CI: Boolean(process.env.CI),
      };

      // `enforce: "pre"` boilerplates first, then `enforce: undefined`, then `enforce: "post"`
      boilerplates.sort((b1, b2) => {
        if (b1.config.enforce === "pre") return -1;
        if (b1.config.enforce === "post") return 1;
        if (b2.config.enforce === "pre") return 1;
        if (b2.config.enforce === "post") return -1;
        return 0;
      });

      const filteredBoilerplates = boilerplates.filter((bl) => testFlags(meta, bl));

      for (const bl of filteredBoilerplates) {
        if (bl.subfolders.includes("files")) {
          sources.push(join(dir, bl.folder, "files"));
        }
        if (bl.subfolders.includes("hooks")) {
          hooks.push(join(dir, bl.folder, "hooks"));
        }
      }

      const hooksMap = await retrieveHooks(hooks);

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

      // Generate knip.json when --knip flag is set (used by E2E tests)
      if (args.knip) {
        await generateKnipConfig(args.project, filteredBoilerplates);
      }

      if (!args["skip-git"]) {
        gitInit(args.project);
      }

      const nextSteps = filteredBoilerplates
        .flatMap((b) => b.config.nextSteps?.(meta, pm.run, colorette))
        .filter(Boolean) as BatiConfigStep[];
      nextSteps.sort((s) => s.order ?? 0);

      await printOK(args.project, flags, nextSteps);
    },
  });

  await runMain(main as CommandDef, {
    showUsage(cmd, parent) {
      const args = cmd.args as BatiArgsDef;

      return showUsage(
        {
          ...cmd,
          // filter invisible args
          args: Object.fromEntries(
            Object.entries(args)
              .map(([k, v]) => (v.invisible ? null : [k, v]))
              // biome-ignore lint/suspicious/noExplicitAny: cast
              .filter(Boolean) as any,
            // biome-ignore lint/suspicious/noExplicitAny: cast
          ) as any,
        },
        parent,
      );
    },
  });
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error("You hit a scaffolder bug — reach out on GitHub");
  }
}

function prettifyDist(path: string) {
  path = path.replaceAll("\\", "/");
  if (!path.endsWith("/")) path = `${path}/`;
  return path;
}
