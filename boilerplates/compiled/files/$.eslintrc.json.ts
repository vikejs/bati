import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getEslintConfig(props: TransformerProps) {
  if (!props.meta.BATI.has("eslint")) return;
  const eslintConfig = await loadAsJson(props);
  eslintConfig.rules ??= {};
  eslintConfig.rules["react/no-unknown-property"] = [
    "error",
    {
      ignore: ["css"],
    },
  ];

  return eslintConfig;
}
