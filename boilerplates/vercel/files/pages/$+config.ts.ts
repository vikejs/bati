import { loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps): Promise<unknown> {
  const mod = await loadAsMagicast(props);

  // @ts-expect-error
  mod.exports.default.prerender = true;

  return mod.generate().code;
}
