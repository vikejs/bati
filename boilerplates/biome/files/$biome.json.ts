import type { TransformerProps } from "@batijs/core";
import type { Configuration, LinterConfiguration } from "@biomejs/wasm-nodejs";

export default async function getBiomeJson(props: TransformerProps) {
  const additionalLinter: Omit<LinterConfiguration, "enabled" | "rules"> = {};
  const additionalConfig: Omit<Configuration, "vcs" | "files" | "assist" | "linter" | "formatter"> = {};

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

  return {
    $schema: "./node_modules/@biomejs/biome/configuration_schema.json",
    formatter: {
      indentWidth: 2,
      indentStyle: "space",
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
      },
      ...additionalLinter,
    },
    assist: {
      enabled: true,
      actions: {
        source: {
          organizeImports: "on",
        },
      },
    },
    files: {
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
      ],
    },
    vcs: {
      enabled: true,
      clientKind: "git",
      useIgnoreFile: true,
    },
    ...additionalConfig,
  };
}
