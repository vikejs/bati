import { loadAsJson } from "@batijs/core";
import type { MaybeContentGetter } from "@batijs/core";

export default async function getTsConfig(currentContent: MaybeContentGetter) {
  const tsConfig = await loadAsJson(currentContent);

  tsConfig.compilerOptions.jsx = "preserve";
  tsConfig.compilerOptions.jsxImportSource = "solid-js";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "solide/types"];

  return tsConfig;
}
