import { type ArgsDef, defineCommand, runMain } from "citty";
import exec from "@batijs/build";
import packageJson from "./package.json" assert { type: "json" };
import type { VikeMeta } from "@batijs/core";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile } from "node:fs/promises";
import type { BoilerplateDef } from "./types";

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

function toArg(def: BoilerplateDef): ArgsDef {
  if (!def.config.flag) return {};

  return {
    [def.config.flag]: {
      type: "boolean",
      required: false,
    },
  };
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
      {
        dist: {
          type: "positional",
          description: "Dist folder",
          required: true,
        },
      },
      ...boilerplates.map(toArg)
    ),
    async run({ args }) {
      const sources: string[] = [];
      const features: string[] = [];
      const flags = Object.entries(args as Record<string, unknown>)
        .filter(([, val]) => val === true)
        .map(([key]) => key);

      // push shared boilerplates first
      for (const bl of boilerplates.filter((b) => !b.config.flag)) {
        sources.push(join(dir, bl.folder));
      }

      for (const bl of boilerplates) {
        if (bl.config.flag && flags.includes(bl.config.flag)) {
          sources.push(join(dir, bl.folder));
          features.push(...(bl.config.features ?? []));
        }
      }

      // TODO
      // if (args.authjs) {
      //   features.push("auth:authjs");
      // }

      await exec(
        {
          source: sources,
          dist: args.dist,
        },
        {
          VIKE_MODULES: features as VikeMeta["VIKE_MODULES"],
        }
      );
    },
  });

  await runMain(main);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
