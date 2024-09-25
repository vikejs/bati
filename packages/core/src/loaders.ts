import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadFile, parseModule, type ProxifiedModule } from "magicast";
import { assert } from "./assert.js";
import { parseReadme } from "./markdown.js";
import {
  type Document as YAMLDocument,
  type DocumentOptions,
  parseDocument,
  type ParseOptions,
  type SchemaOptions,
} from "yaml";
import type { TransformerProps } from "./types.js";
import { parseMarkdown } from "./markdown/markdown.js";
import { type PackageJsonDeps, PackageJsonTransformer } from "./utils/package.js";

export type { YAMLDocument };

export async function loadReadme({ readfile }: TransformerProps) {
  const content = await readfile?.();

  return parseReadme(content);
}

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

export async function loadAsMagicast<Exports extends object>({
  readfile,
  source,
  target,
}: TransformerProps): Promise<ProxifiedModule<Exports>> {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous module ("${source}" -> "${target}")`);

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
  options?: ParseOptions & DocumentOptions & SchemaOptions,
) {
  const content = await readfile?.();

  assert(typeof content === "string", `Unable to load previous YAML module ("${source}" -> "${target}")`);

  return parseDocument(content, options);
}
