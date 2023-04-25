import { generateCode } from "magicast";
import { loadRelativeFileAsMagicast, transformAst, type MaybeContentGetter, type VikeMeta } from "@batijs/core";

// TODO: Move AST logic in build package? (with another naming convention)
export default async function getHattipFile(_currentContent: MaybeContentGetter, config: VikeMeta) {
  const mod = await loadRelativeFileAsMagicast("./#node-server.ts", import.meta);

  transformAst(mod.$ast, config);

  return generateCode(mod).code;
}
