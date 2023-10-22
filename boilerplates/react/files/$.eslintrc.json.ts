import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getEslintConfig(props: TransformerProps) {
  if (!props.meta.BATI.has("eslint")) return;

  const eslintConfig = await loadAsJson(props);
  eslintConfig.extends = eslintConfig.extends.filter(
    (p: string) => p !== "eslint:recommended" && p !== "plugin:@typescript-eslint/recommended",
  );
  eslintConfig.extends.push("react-app");
  eslintConfig.plugins = eslintConfig.plugins.filter((p: string) => p !== "@typescript-eslint");
  return eslintConfig;
}
