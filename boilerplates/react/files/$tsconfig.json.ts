import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);

  tsConfig.compilerOptions.jsx = "preserve";
  tsConfig.compilerOptions.jsxImportSource = "react";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "vike-react"];

  return tsConfig;
}
