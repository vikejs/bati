import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getEslintConfig(props: TransformerProps) {
  if (!props.meta.BATI.has("eslint")) return;

  const eslintConfig = await loadAsJson(props);
  eslintConfig.extends = eslintConfig.extends.filter(
    (p: string) => p !== "eslint:recommended" && p !== "plugin:@typescript-eslint/recommended",
  );
  eslintConfig.extends.push("plugin:react/recommended");
  eslintConfig.plugins = eslintConfig.plugins.filter((p: string) => p !== "@typescript-eslint");
  eslintConfig.plugins.push("react");
  eslintConfig.settings ??= {};
  eslintConfig.settings.react = { version: "detect" };
  eslintConfig.parserOptions ??= {};
  eslintConfig.parserOptions.ecmaFeatures ??= {};
  eslintConfig.parserOptions.ecmaFeatures.jsx = true;

  return eslintConfig;
}
