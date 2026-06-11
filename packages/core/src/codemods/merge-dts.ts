import { defineCodemod } from "@codegraft/codemod";
import type { Collection, GrammarId } from "@codegraft/core";
import { unquote } from "./text.js";

/**
 * Merge duplicate ambient / namespace / interface declarations within a single source — the way to
 * merge N `.d.ts` files: concatenate them, then run this. Same-named `declare global` /
 * `declare module` / `namespace` blocks fold into the first (recursively); same-named `interface`s
 * union their members (deduped); duplicate imports / `export {}` / other top-level statements dedupe
 * by text. Two files merge exactly; with three or more, a declaration that is *absent* from the first
 * file but repeated in later ones is left as a duplicate for TypeScript's own declaration merging.
 */
export const mergeDts = defineCodemod({ format: true }, (root) => {
  const top = list(root.children());
  hoistImports(root, top);
  mergeScope(top.filter((c) => c.type !== "import_statement"));
});

// `tsx` is a superset of TypeScript, so one grammar covers `.d.ts` too — matching the rest of the pipeline.
export const targets: GrammarId[] = ["tsx"];

/** Lift every import to the top, deduped by text — later files' imports would otherwise be stranded
 *  below the merged declarations once their own blocks are folded away. */
function hoistImports(root: Collection, top: Collection[]): void {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const sib of top) {
    if (sib.type !== "import_statement") continue;
    if (!seen.has(sib.text)) {
      seen.add(sib.text);
      unique.push(sib.text);
    }
    sib.remove();
  }
  if (unique.length > 0) root.prependToFile(`${unique.join("\n")}\n`);
}

/** Keep the first declaration of each key, fold the rest into it; dedupe plain statements by text. */
function mergeScope(siblings: Collection[]): Scope {
  const scope: Scope = { interfaces: new Map(), containers: new Map(), seen: new Set() };
  for (const sib of siblings) {
    const decl = classify(sib);
    if (!decl) {
      if (scope.seen.has(sib.text)) sib.remove();
      else scope.seen.add(sib.text);
    } else if (decl.kind === "interface") {
      const canon = scope.interfaces.get(decl.key);
      if (!canon)
        scope.interfaces.set(decl.key, { body: decl.body, members: new Set(decl.body.children().map((m) => m.text)) });
      else {
        foldMembers(canon, decl.body);
        sib.remove();
      }
    } else {
      const canon = scope.containers.get(decl.key);
      if (!canon) scope.containers.set(decl.key, { body: decl.body, scope: mergeScope(list(decl.body.children())) });
      else {
        foldContainer(canon, decl.body);
        sib.remove();
      }
    }
  }
  return scope;
}

/** Merge a duplicate container's children into the canonical one: recurse into a matching child,
 *  relocate (append verbatim) a unique one. */
function foldContainer(canon: Container, dupBody: Collection): void {
  for (const sib of list(dupBody.children())) {
    const decl = classify(sib);
    if (!decl) {
      if (!canon.scope.seen.has(sib.text)) {
        canon.scope.seen.add(sib.text);
        canon.body.append(sib.text);
      }
    } else if (decl.kind === "interface") {
      const child = canon.scope.interfaces.get(decl.key);
      if (child) foldMembers(child, decl.body);
      else canon.body.append(sib.text);
    } else {
      const child = canon.scope.containers.get(decl.key);
      if (child) foldContainer(child, decl.body);
      else canon.body.append(sib.text);
    }
  }
}

/** Append a duplicate interface's not-yet-present members (with their leading comments) to the canonical. */
function foldMembers(canon: Interface, dupBody: Collection): void {
  for (const member of list(dupBody.children())) {
    if (canon.members.has(member.text)) continue;
    canon.members.add(member.text);
    const comments = member.node.leadingComments.map((c) => c.text).join("\n");
    canon.body.append(comments ? `${comments}\n${member.text}` : member.text);
  }
}

/** Classify a scope sibling as a mergeable declaration, or `null` for imports / `export {}` / other. */
function classify(sib: Collection): Decl | null {
  switch (sib.type) {
    case "interface_declaration":
      return { kind: "interface", key: `I:${sib.field("name").text}`, body: sib.field("body") };
    case "internal_module":
      return namespaceDecl(sib);
    case "expression_statement": {
      const inner = sib.children().first(); // `namespace X {}` parses as an expression statement
      return inner.type === "internal_module" ? namespaceDecl(inner) : null;
    }
    case "ambient_declaration":
      return ambientDecl(sib);
    default:
      return null;
  }
}

function ambientDecl(ambient: Collection): Decl | null {
  const child = ambient.children().first();
  switch (child.type) {
    case "statement_block": // `declare global { … }`
      return { kind: "container", key: "G", body: child };
    case "module": // `declare module "x" { … }`
      return { kind: "container", key: `M:${unquote(child.field("name").text)}`, body: child.field("body") };
    case "internal_module": // `declare namespace X { … }`
      return namespaceDecl(child);
    default:
      return null;
  }
}

function namespaceDecl(mod: Collection): Decl {
  return { kind: "container", key: `N:${mod.field("name").text}`, body: mod.field("body") };
}

const list = (collection: Collection): Collection[] => collection.map((c) => c);

interface Decl {
  kind: "interface" | "container";
  key: string;
  body: Collection; // where members (interface) or child declarations (container) live
}
interface Interface {
  body: Collection;
  members: Set<string>;
}
interface Container {
  body: Collection;
  scope: Scope;
}
interface Scope {
  interfaces: Map<string, Interface>;
  containers: Map<string, Container>;
  seen: Set<string>; // imports / export {} / other statements, deduped by text
}
