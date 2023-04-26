import { defineCommand, runMain, type CommandDef } from "citty";
import exec from "@batijs/build";
import sharedFilesPath from "@batijs/shared";
import packageJson from "./package.json" assert { type: "json" };
import type { VikeMeta } from "@batijs/core";

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
    solid: {
      type: "boolean",
      description: "SolidJS",
      required: false,
    },
    hattip: {
      type: "boolean",
      description: "Hattip",
      required: false,
    },
    telefunc: {
      type: "boolean",
      description: "Telefunc",
      required: false,
    },
    authjs: {
      type: "boolean",
      description: "AuthJS",
      required: false,
    },
  },
  async run({ args }) {
    const sources: string[] = [sharedFilesPath];
    const features: VikeMeta["VIKE_MODULES"] = [];

    if (args.solid) {
      sources.push((await import("@batijs/solid/files")).default);
      features.push("framework:solid");
    }

    if (args.hattip) {
      sources.push((await import("@batijs/hattip/files")).default);
      features.push("server:hattip");
    }

    if (args.telefunc) {
      sources.push((await import("@batijs/telefunc/files")).default);
      features.push("rpc:telefunc");
    }

    if (args.telefunc) {
      features.push("auth:authjs");
    }

    await exec(
      {
        source: sources,
        dist: args.dist,
      },
      {
        VIKE_MODULES: features,
      }
    );
  },
});

runMain(main as CommandDef);
