import type { Lang, SgNode } from "@ast-grep/napi";
import { parse } from "@ast-grep/napi";
import type { Extractor } from "../linters/common.js";
import { applyEdits, type TextEdit } from "./apply-edits.js";

function isDescendant(ancestor: SgNode, node: SgNode): boolean {
  const aStart = ancestor.range().start.index;
  const aEnd = ancestor.range().end.index;
  const nStart = node.range().start.index;
  const nEnd = node.range().end.index;
  return nStart >= aStart && nEnd <= aEnd;
}

function removeNodeWithNewline(node: SgNode, code: string): TextEdit {
  const start = node.range().start.index;
  let end = node.range().end.index;
  while (end < code.length && code[end] !== "\n" && (code[end] === " " || code[end] === "\t")) {
    end++;
  }
  if (end < code.length && code[end] === "\n") {
    end++;
  }
  return { startIndex: start, endIndex: end, newText: "" };
}

interface Specifier {
  name: string;
  node: SgNode;
  isDefault: boolean;
}

function collectSpecifiers(importNode: SgNode): Specifier[] {
  const specifiers: Specifier[] = [];

  for (const child of importNode.children()) {
    if (child.kind() === "import_clause") {
      for (const clauseChild of child.children()) {
        if (clauseChild.kind() === "identifier") {
          specifiers.push({ name: clauseChild.text(), node: clauseChild, isDefault: true });
        } else if (clauseChild.kind() === "named_imports") {
          for (const spec of clauseChild.children()) {
            if (spec.kind() === "import_specifier") {
              // Could have alias: `import { a as b }` — local name is last identifier
              const children = spec.children().filter((c) => c.kind() === "identifier");
              const localName = children[children.length - 1];
              if (localName) {
                specifiers.push({ name: localName.text(), node: spec, isDefault: false });
              }
            }
          }
        }
        // namespace_import (import * as ns) — skip, can't easily check usage
      }
    }
  }

  return specifiers;
}

// Rebuild an import statement retaining only the used specifiers.
// Returns a TextEdit that replaces the whole import statement.
function rebuildImport(importNode: SgNode, usedSpecs: Specifier[], sourceText: string): TextEdit {
  const defaultSpec = usedSpecs.find((s) => s.isDefault);
  const namedSpecs = usedSpecs.filter((s) => !s.isDefault);

  let clause = "";
  if (defaultSpec) clause += defaultSpec.name;
  if (defaultSpec && namedSpecs.length > 0) clause += ", ";
  if (namedSpecs.length > 0) {
    clause += `{ ${namedSpecs.map((s) => s.node.text()).join(", ")} }`;
  }

  return {
    startIndex: importNode.range().start.index,
    endIndex: importNode.range().end.index,
    newText: `import ${clause} from ${sourceText}`,
  };
}

export function removeUnusedImports(code: string, lang: Lang, extractor: Extractor): string {
  const root = parse(lang, code).root();
  const edits: TextEdit[] = [];

  for (const importNode of root.findAll({ rule: { kind: "import_statement" } })) {
    const sourceNode = importNode.field("source");
    if (!sourceNode) continue;
    const source = sourceNode.text().slice(1, -1);

    const specifiers = collectSpecifiers(importNode);
    if (specifiers.length === 0) continue;

    const usedSpecs: Specifier[] = [];
    for (const spec of specifiers) {
      const usages = [
        ...root.findAll({ rule: { kind: "identifier", regex: `^${spec.name}$` } }),
        ...root.findAll({ rule: { kind: "type_identifier", regex: `^${spec.name}$` } }),
      ].filter((n) => !isDescendant(importNode, n));

      if (usages.length > 0) {
        usedSpecs.push(spec);
      }
    }

    if (usedSpecs.length === specifiers.length) continue; // all used

    if (usedSpecs.length === 0) {
      // all unused — remove entire import
      extractor.deleteImport(source);
      edits.push(removeNodeWithNewline(importNode, code));
    } else {
      // some unused — rebuild import with only used specifiers
      edits.push(rebuildImport(importNode, usedSpecs, sourceNode.text()));
    }
  }

  return applyEdits(code, edits);
}
