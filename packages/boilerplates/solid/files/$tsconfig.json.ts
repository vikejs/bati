import { importSharedJsonFile } from "../src/utils.js";

export default async function getTsConfig() {
  const tsConfig = await importSharedJsonFile(import.meta);

  tsConfig.compilerOptions.jsx = "preserve";
  tsConfig.compilerOptions.jsxImportSource = "solid-js";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "solide/types"];

  return tsConfig;
}
