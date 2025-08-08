import type { TransformerProps } from "@batijs/core";

export default async function getBiomeJson(props: TransformerProps) {
  const additionalLinter: { domains?: Record<string, string> } = {};

  if (props.meta.BATI.has("vue")) {
    additionalLinter.domains = {
      vue: "recommended",
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
      includes: ["!dist/**", "!*.js", "!*.cjs", "!*.mjs", "!*.spec.ts"],
    },
    vcs: {
      enabled: true,
      clientKind: "git",
      useIgnoreFile: true,
    },
  };
}
