import { loadAsMagicast, type TransformerProps, deepMergeObject } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  // @ts-ignore
  deepMergeObject(mod.exports.default.$args[0], {
    resolve: {
      alias: [
        {
          find: "@",
          replacement: "{{PLACEHOLDER_ALIAS}}",
        },
      ],
    },
  });

  return mod.generate().code.replace(`"{{PLACEHOLDER_ALIAS}}"`, `new URL("./", import.meta.url).pathname`);
}
