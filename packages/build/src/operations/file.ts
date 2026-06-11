import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import type { VikeMeta } from "@batijs/core";
import { transformAndFormat } from "@batijs/core";
import type { FileOperation, OperationReport } from "./common.js";
import { clearExports, mergeDts } from "./merge-dts.js";

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

  let fileContent: string | undefined = result.code;

  if (op.sourceAbsolute.endsWith(".d.ts")) {
    if (previousOperationSameDestination?.content) {
      fileContent = await mergeDts({
        fileContent,
        previousContent: previousOperationSameDestination.content,
        filepath,
        meta,
      });
    } else {
      fileContent = clearExports(fileContent, meta);
    }
  }

  return {
    context: result.context,
    content: fileContent ? fileContent.trimStart() : undefined,
  };
}
