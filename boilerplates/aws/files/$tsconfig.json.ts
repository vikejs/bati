// files/$tsconfig.json.ts
import { loadAsJson, type TransformerProps } from "@batijs/core";
async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);
  tsConfig.compilerOptions.types = [
    ...(tsConfig.compilerOptions.types ?? []),
    "node",
    "vitest/globals",
    "@types/which",
  ];
  return tsConfig;
}
export { getTsConfig as default };
