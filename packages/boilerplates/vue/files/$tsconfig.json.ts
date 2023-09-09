import type { MaybeContentGetter } from "@batijs/core";
import { loadAsJson } from "@batijs/core";

export default async function getTsConfig(currentContent: MaybeContentGetter) {
  const tsConfig = await loadAsJson(currentContent);

  tsConfig.compilerOptions.jsx = "preserve";
  tsConfig.compilerOptions.jsxImportSource = "vue";
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "vike-vue"];

  return tsConfig;
}
