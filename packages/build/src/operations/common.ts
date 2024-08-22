import type { ParsedPath } from "node:path";
import type { FileContext } from "@batijs/core";

export interface FileOperation {
  source: string;
  sourceAbsolute: string;
  destination: string;
  destinationAbsolute: string;
  parsed: ParsedPath;
  kind: "file" | "transform";
  important?: boolean;
}

export interface OperationReport {
  context?: FileContext;
  content?: string;
}
