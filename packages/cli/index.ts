import { defineCommand, runMain, type CommandDef } from "citty";
import exec from "@batijs/build";
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
  run({ args }) {
    exec(
      {
        dist: args.dist,
      },
      {
        VIKE_FRAMEWORK: args.framework,
      }
    );
  },
});

runMain(main as CommandDef);
