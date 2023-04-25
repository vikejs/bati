import { generateCode } from "magicast";
import { transformAst, type MaybeContentGetter, type VikeMeta } from "@batijs/core";
import { loadRelativeFileAsMagicast } from "@batijs/core";

// TODO: Move AST logic in build package?
export default async function getHattipFile(_currentContent: MaybeContentGetter, config: VikeMeta) {
  const mod = await loadRelativeFileAsMagicast("./#node-server.ts", import.meta);

  transformAst(mod.$ast, config);

  return generateCode(mod).code;
}
