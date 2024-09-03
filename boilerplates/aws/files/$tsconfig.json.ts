import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);
  tsConfig.compilerOptions.types = [
    ...(tsConfig.compilerOptions.types ?? []),
    "@types/node",
    "vitest/globals",
    "@types/which",
  ];
  return tsConfig;
}