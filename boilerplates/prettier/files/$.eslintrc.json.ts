import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getEslintConfig(props: TransformerProps) {
  if (!props.meta.BATI.has("eslint")) return;

  const eslintConfig = await loadAsJson(props);
  eslintConfig.extends.push("prettier");
  return eslintConfig;
}
