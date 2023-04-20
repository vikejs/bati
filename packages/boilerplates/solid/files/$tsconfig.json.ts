import { loadJsonFile } from "../src/utils.js";

export default async function getTsConfig(currentContent: (() => string | Promise<string>) | undefined) {
  const tsConfig = await loadJsonFile(currentContent);

  tsConfig.compilerOptions.jsx = "preserve";
  tsConfig.compilerOptions.jsxImportSource = "solid-js";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "solide/types"];

  return tsConfig;
}
