import type { TransformerProps } from "@batijs/core";

export default async function getOxlintJson(props: TransformerProps) {
  const oxlintPlugins: string[] = ["eslint", "typescript", "unicorn", "oxc"];
  const jsPlugins: string[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: cast
  const rules: Record<string, any> = {};

  if (props.meta.BATI.has("vue")) {
    oxlintPlugins.push("vue");
  }

  if (props.meta.BATI.has("react")) {
    oxlintPlugins.push("react", "jsx-a11y");
  }

  if (props.meta.BATI.has("solid")) {
    jsPlugins.push("eslint-plugin-solid");
    rules["solid/components-return-once"] = "error";
    rules["solid/event-handlers"] = "error";
    rules["solid/imports"] = "error";
    rules["solid/jsx-no-duplicate-props"] = "error";
    rules["solid/jsx-no-undef"] = "error";
    rules["solid/jsx-no-script-url"] = "error";
    rules["solid/jsx-uses-vars"] = "error";
    rules["solid/no-destructure"] = "error";
    rules["solid/no-innerhtml"] = "error";
    rules["solid/no-proxy-apis"] = "error";
    rules["solid/no-react-deps"] = "error";
    rules["solid/no-react-specific-props"] = "error";
    rules["solid/no-unknown-namespaces"] = "error";
    rules["solid/prefer-classlist"] = "error";
    rules["solid/prefer-for"] = "error";
    rules["solid/prefer-show"] = "error";
    rules["solid/reactivity"] = "error";
    rules["solid/self-closing-comp"] = "error";
    rules["solid/style-prop"] = "error";
    rules["solid/no-array-handlers"] = "error";
  }

  return JSON.stringify({
    $schema: "./node_modules/oxlint/configuration_schema.json",
    plugins: oxlintPlugins,
    jsPlugins,
  });
}
