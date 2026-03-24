import { loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getTsConfig(props: TransformerProps): Promise<unknown> {
  const tsConfig = await loadAsJson(props);
  return tsConfig;
}
