import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);

  tsConfig.compilerOptions.jsx = "react-jsx";
  tsConfig.compilerOptions.jsxImportSource = "vue";

  return tsConfig;
}
