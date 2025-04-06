import { loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  // @ts-ignore
  mod.exports.default.prerender = true;

  return mod.generate().code;
}
