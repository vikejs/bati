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

// Collect import specifier nodes from an import_statement
// Returns array of { name, node } for each named binding
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
          // default import: import foo from "..."
          specifiers.push({ name: clauseChild.text(), node: clauseChild, isDefault: true });
        } else if (clauseChild.kind() === "named_imports") {
          // named: import { a, b } from "..."
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
        } else if (clauseChild.kind() === "namespace_import") {
          // import * as ns from "..." — skip, can't easily check usage
        }
      }
    }
  }

  return specifiers;
}

function removeSpecifier(specNode: SgNode, importNode: SgNode, code: string): TextEdit {
  const namedImports = importNode
    .children()
    .flatMap((c) => (c.kind() === "import_clause" ? c.children() : []))
    .find((c) => c.kind() === "named_imports");

  if (!namedImports) return { startIndex: 0, endIndex: 0, newText: "" };

  const allSpecs = namedImports.children().filter((c) => c.kind() === "import_specifier");
  const idx = allSpecs.findIndex((s) => s.range().start.index === specNode.range().start.index);

  if (allSpecs.length === 1) {
    // only specifier — remove entire import
    return removeNodeWithNewline(importNode, code);
  }

  if (idx < allSpecs.length - 1) {
    // not last: remove from start of this specifier to start of next
    const nextSpec = allSpecs[idx + 1];
    return {
      startIndex: specNode.range().start.index,
      endIndex: nextSpec.range().start.index,
      newText: "",
    };
  } else {
    // last: remove from end of previous to end of this
    const prevSpec = allSpecs[idx - 1];
    return {
      startIndex: prevSpec.range().end.index,
      endIndex: specNode.range().end.index,
      newText: "",
    };
  }
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

    for (const { name, node: specNode } of specifiers) {
      // Find all identifier usages outside the import declaration
      const usages = root
        .findAll({ rule: { kind: "identifier", regex: `^${name}$` } })
        .filter((n) => !isDescendant(importNode, n));

      if (usages.length === 0) {
        if (specifiers.length === 1) {
          extractor.deleteImport(source);
          edits.push(removeNodeWithNewline(importNode, code));
        } else {
          edits.push(removeSpecifier(specNode, importNode, code));
        }
      }
    }
  }

  return applyEdits(code, edits);
}
