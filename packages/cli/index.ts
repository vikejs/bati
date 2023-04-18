import { defineCommand, runMain, type CommandDef } from "citty";
import exec from "@batijs/build";
import sharedFilesPath from "@batijs/shared";
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
    const sources = [sharedFilesPath];
    if (args.framework === "solid") {
      const solidFilesPath = (await import("@batijs/solid")).default;
      sources.push(solidFilesPath);
    }

    await exec(
      {
        source: sources,
        dist: args.dist,
      },
      {}
    );
  },
});

runMain(main as CommandDef);
