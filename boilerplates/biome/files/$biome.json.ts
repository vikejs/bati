import type { TransformerProps } from "@batijs/core";
import type { Configuration, LinterConfiguration } from "@biomejs/wasm-nodejs";

export default async function getBiomeJson(props: TransformerProps) {
  const additionalLinter: Omit<LinterConfiguration, "enabled"> = {};
  const additionalConfig: Omit<Configuration, "vcs" | "assist" | "linter" | "formatter"> = {};

  if (props.meta.BATI.has("vue")) {
    additionalLinter.domains = {
      vue: "recommended",
    };
    // See https://biomejs.dev/internals/language-support/#html-super-languages-support
    additionalLinter.rules = {
      style: {
        useConst: "off",
        useImportType: "off",
      },
      correctness: {
        noUnusedVariables: "off",
        noUnusedImports: "off",
      },
    };
  }

  if (props.meta.BATI.has("react")) {
    additionalLinter.domains = {
      react: "recommended",
    };
    additionalConfig.overrides ??= [];
    additionalConfig.overrides.push({
      includes: ["**/+data.ts", "**/+data.js"],
      linter: {
        rules: {
          correctness: {
            useHookAtTopLevel: "off",
          },
        },
      },
    });
  }

  if (props.meta.BATI.has("solid")) {
    additionalLinter.domains = {
      solid: "recommended",
    };
  }

  if (props.meta.BATI.has("tailwindcss")) {
    additionalConfig.css ??= {};
    additionalConfig.css.parser ??= {};
    additionalConfig.css.parser.tailwindDirectives = true;
  }

  if (props.meta.BATI.has("tailwindcss") || props.meta.BATI.has("shadcn-ui")) {
    additionalConfig.overrides ??= [];
    additionalConfig.overrides.push({
      includes: ["**/*.css"],
      linter: {
        rules: {
          suspicious: {
            noUnknownAtRules: "off",
          },
        },
      },
    });
  }

  additionalConfig.files ??= {};
  additionalConfig.files.includes ??= [];
  if (props.meta.BATI.has("cloudflare")) {
    additionalConfig.files.includes.push("!worker-configuration.d.ts");
  }

  return {
    ...additionalConfig,
    $schema: "./node_modules/@biomejs/biome/configuration_schema.json",
    formatter: {
      indentStyle: "space",
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
        ...additionalLinter.rules,
      },
      ...additionalLinter,
    },
    files: {
      ...additionalConfig.files,
      includes: [
        "**",
        "!*.cjs",
        "!*.js",
        "!*.mjs",
        "!*.spec.ts",
        "!**/*.ts.build-*.mjs",
        "!dist/*",
        "!node_modules/*",
        "!**/.DS_Store",
        ...additionalConfig.files.includes,
      ],
    },
    vcs: {
      enabled: true,
      clientKind: "git",
      useIgnoreFile: true,
    },
  };
}
