import { defineCommand, runMain, type CommandDef } from "citty";
import exec from "@batijs/build";
import sharedFilesPath from "@batijs/shared";
import solidFilesPath from "@batijs/solid";
import packageJson from "./package.json" assert { type: "json" };

const main = defineCommand({
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
  },
  args: {
    dist: {
      type: "positional",
      description: "Dist folder",
      required: true,
    },
    framework: {
      type: "string",
      description: "UI framework",
      required: false,
    },
  },
  async run({ args }) {
    await exec(
      {
        source: sharedFilesPath,
        dist: args.dist,
      },
      {}
    );

    if (args.framework === "solid") {
      await exec(
        {
          source: solidFilesPath,
          dist: args.dist,
        },
        {}
      );
    }
  },
});

runMain(main as CommandDef);
