import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps): Promise<unknown> {
  const tsConfig = await loadAsJson(props);

  tsConfig.compilerOptions.jsx = "react-jsx";
  tsConfig.compilerOptions.jsxImportSource = "react";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "vike-react"];

  return tsConfig;
}
