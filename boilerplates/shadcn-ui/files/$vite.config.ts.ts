import { defineConfigArg, mergeObject, type TransformerProps, transformConfig } from "@batijs/core";

export default function getViteConfig(props: TransformerProps): Promise<unknown> {
  return transformConfig(props, (root) => {
    // Set `resolve.alias["@"]` to an expression (emitted verbatim as code, not a string literal).
    mergeObject(defineConfigArg(root), {
      resolve: { alias: { "@": `new URL("./", import.meta.url).pathname` } },
    });
  });
}
