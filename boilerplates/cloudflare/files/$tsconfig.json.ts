import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);

  /* TO-DO/eventually: how to avoid typecheck CI fail?
  tsConfig.compilerOptions.types = [...(tsConfig.compilerOptions.types ?? []), "./worker-configuration.d.ts"];
  */

  return tsConfig;
}
