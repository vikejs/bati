import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps) {
  const tsConfig = await loadAsJson(props);

  tsConfig.compilerOptions.paths = {
    ...(tsConfig.compilerOptions?.paths ?? {}),
    "@/*": ["./*"],
  };

  return tsConfig;
}
