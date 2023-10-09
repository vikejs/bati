import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getEslintConfig(props: TransformerProps) {
  if (!props.meta.BATI_MODULES?.includes("tool:eslint")) return;

  const eslintConfig = await loadAsJson(props);
  eslintConfig.extends.push("plugin:vue/vue3-recommended");
  eslintConfig.parser = "vue-eslint-parser";
  eslintConfig.parserOptions.parser = "@typescript-eslint/parser";
  eslintConfig.rules ??= {};
  eslintConfig.rules["vue/multi-word-component-names"] = "off";
  return eslintConfig;
}
