import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFile, type ProxifiedModule, parseModule } from "magicast";
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
import {
  type PackageJsonDeps,
  PackageJsonTransformer,
} from "./utils/package.js";

export type { YAMLDocument };

export async function loadMarkdown({ readfile }: TransformerProps) {
  const content = await readfile?.();
  return parseMarkdown(content ?? "");
}

export async function loadAsJson({
  readfile,
  source,
  target,
}: TransformerProps) {
  const content = await readfile?.();

  assert(
    typeof content === "string",
    `Unable to load previous JSON module ("${source}" -> "${target}")`,
  );

  return JSON.parse(content);
}

export async function loadPackageJson<U extends PackageJsonDeps>(
  { readfile, source, target }: TransformerProps,
  scopedPackageJson: U,
) {
  const content = await readfile?.();

  assert(
    typeof content === "string",
    `Unable to load previous JSON module ("${source}" -> "${target}")`,
  );

  return new PackageJsonTransformer(JSON.parse(content), scopedPackageJson);
}

export async function loadAsMagicast<Exports extends object>({
  readfile,
  source,
  target,
}: TransformerProps): Promise<ProxifiedModule<Exports>> {
  const content = await readfile?.();

  assert(
    typeof content === "string",
    `Unable to load previous module ("${source}" -> "${target}")`,
  );

  return parseModule(content);
}

export async function loadRelativeFileAsMagicast<Exports extends object>(
  relativePath: string,
  meta: Pick<ImportMeta, "url">,
): Promise<ProxifiedModule<Exports>> {
  const __filename = fileURLToPath(meta.url);
  const __dirname = dirname(__filename);

  return loadFile(join(__dirname, relativePath));
}

export async function loadYaml(
  { readfile, source, target }: TransformerProps,
  options?: ParseOptions &
    DocumentOptions &
    SchemaOptions & { fallbackEmpty?: boolean },
) {
  const content = await readfile?.();

  assert(
    typeof content === "string" || options?.fallbackEmpty,
    `Unable to load previous YAML module ("${source}" -> "${target}")`,
  );

  return parseDocument(content ?? "", options);
}
