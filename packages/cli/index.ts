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
    server: {
      type: "string",
      description: "Server",
      required: false,
    },
    rpc: {
      type: "string",
      description: "RPC",
      required: false,
    },
  },
  async run({ args }) {
    const sources = [sharedFilesPath];
    if (args.framework === "solid") {
      sources.push((await import("@batijs/solid")).default);
    }

    if (args.server === "hattip") {
      sources.push((await import("@batijs/vike-hattip")).default);
    }

    if (args.rpc === "telefunc") {
      sources.push((await import("@batijs/vike-telefunc")).default);
    }

    await exec(
      {
        source: sources,
        dist: args.dist,
      },
      {
        VIKE_FRAMEWORK: args.framework as any,
        VIKE_RPC: args.rpc as any,
        VIKE_SERVER: args.server as any,
      }
    );
  },
});

runMain(main as CommandDef);
