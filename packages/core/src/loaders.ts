import {
  type DocumentOptions,
  type ParseOptions,
  parseDocument,
  type SchemaOptions,
  type Document as YAMLDocument,
} from "yaml";
import { assert } from "./assert.js";
import { parseMarkdown } from "./markdown/markdown.js";
import type { TransformerProps } from "./types.js";
import { type PackageJsonDeps, PackageJsonTransformer } from "./utils/package.js";

export { YAMLMap, YAMLSeq } from "yaml";
export type { YAMLDocument };

export async function loadMarkdown({ readfile }: TransformerProps) {
  const content = await readfile?.();
  return parseMarkdown(content ?? "");
}

export async function loadAsJson({ readfile, source, target }: TransformerProps) {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous JSON module ("${source}" -> "${target}")`);

  return JSON.parse(content);
}

export async function loadPackageJson<U extends PackageJsonDeps>(
  { readfile, source, target }: TransformerProps,
  scopedPackageJson: U,
) {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous JSON module ("${source}" -> "${target}")`);

  return new PackageJsonTransformer(JSON.parse(content), scopedPackageJson);
}

export async function loadYaml(
  { readfile, source, target }: TransformerProps,
  options?: ParseOptions & DocumentOptions & SchemaOptions & { fallbackEmpty?: boolean },
) {
  const content = await readfile?.();

  assert(
    typeof content === "string" || options?.fallbackEmpty,
    `Unable to load previous YAML module ("${source}" -> "${target}")`,
  );

  return parseDocument(content ?? "", options);
}
