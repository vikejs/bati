import { defineCommand, runMain, type CommandDef } from "citty";
import exec from "@base/build";
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
  },
  run({ args }) {
    exec(
      {
        dist: args.dist,
      },
      {}
    );
  },
});

runMain(main as CommandDef);
