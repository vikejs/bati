import { parse } from "path";
import type { FileOperation, OperationReport } from "./common.js";
import type { Transformer, VikeMeta, YAMLDocument } from "@batijs/core";
import { formatCode } from "@batijs/core";

const isWin = process.platform === "win32";

async function transformFileAfterExec(filepath: string, fileContent: unknown): Promise<string | null> {
  if (fileContent === undefined || fileContent === null) return null;
  const parsed = parse(filepath);
  const toTest = [parsed.base, parsed.ext, parsed.name].filter(Boolean);

  for (const ext of toTest) {
    switch (ext) {
      case ".ts":
      case ".js":
      case ".cjs":
      case ".tsx":
      case ".jsx":
        return formatCode(fileContent as string, {
          filepath,
        });
      case ".env":
      case ".env.local":
      case ".env.development":
      case ".env.development.local":
      case ".env.test":
      case ".env.test.local":
      case ".env.production":
      case ".env.production.local":
      case ".html":
      case ".md":
        return fileContent as string;
      case ".json":
        return JSON.stringify(fileContent, null, 2);
      case ".yml":
      case ".yaml":
        if (typeof fileContent === "string") return fileContent;
        return (fileContent as YAMLDocument).toString();
    }
  }
  throw new Error(`Unsupported file extension ${parsed.base} (${filepath})`);
}

async function importTransformer(p: string) {
  const importFile = isWin ? "file://" + p : p;
  const f = await import(importFile);

  return f.default as Transformer;
}

export async function executeOperationTransform(
  op: FileOperation,
  {
    meta,
    previousOperationSameDestination,
  }: { meta: VikeMeta; previousOperationSameDestination?: FileOperation & OperationReport },
): Promise<OperationReport> {
  const transformer = await importTransformer(op.sourceAbsolute);

  const previousContent = previousOperationSameDestination?.content;

  const fileContent = await transformFileAfterExec(
    op.destination,
    await transformer({
      readfile: previousContent ? () => previousContent : undefined,
      meta,
      source: op.source,
      target: op.destination,
    }),
  );

  return {
    content: fileContent !== null ? fileContent : undefined,
  };
}
