import type { FileOperation, OperationReport } from "./common.js";
import type { VikeMeta } from "@batijs/core";
import { transformAndFormat } from "@batijs/core";
import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import { mergeDts } from "./merge-dts.js";

export async function executeOperationFile(
  op: FileOperation,
  {
    meta,
    previousOperationSameDestination,
  }: { meta: VikeMeta; previousOperationSameDestination?: FileOperation & OperationReport },
): Promise<OperationReport> {
  const code = await readFile(op.sourceAbsolute, { encoding: "utf-8" });
  const filepath = relative(op.source, op.sourceAbsolute);

  const result = await transformAndFormat(code, meta, {
    filepath,
  });

  let fileContent = result.code;

  if (op.sourceAbsolute.endsWith(".d.ts") && previousOperationSameDestination?.content) {
    // console.log("MERGING .d.ts", op.sourceAbsolute, previousOperationSameDestination.sourceAbsolute);
    // Merging .d.ts files here
    fileContent = await mergeDts({
      fileContent,
      previousContent: previousOperationSameDestination.content,
      meta,
      filepath,
    });
  }

  return {
    context: result.context,
    content: fileContent ? fileContent.trimStart() : undefined,
  };
}
