import { isScalar, isSeq, type Node, parseDocument, visit, type YAMLMap } from "yaml";
import { assert } from "../assert.js";
import type { VikeMeta } from "../types.js";
import { evalCondition } from "./eval.js";

/**
 * Append `KEY=value` items to `services.<service>.environment` of a
 * docker-compose document. Used to inject the env-registry-derived env block
 * (see `composeEnvEntries`) without the compose boilerplate hardcoding vars.
 */
export function setComposeEnvironment(code: string, entries: string[], service = "app"): string {
  if (entries.length === 0) return code;

  const doc = parseDocument(code);
  const env = doc.getIn(["services", service, "environment"]);
  assert(isSeq(env), `compose service '${service}' has no 'environment' list to extend`);
  for (const entry of entries) env.add(entry);

  return doc.toString();
}

const isBatiLine = (line: string) => line.includes("BATI.has") || line.includes("BATI_TEST");

function extractBatiCondition(commentBefore: string | null | undefined): string | null {
  for (const line of commentBefore?.split("\n") ?? []) {
    if (isBatiLine(line)) return line.replace(/^#\s*/, "").trim();
  }
  return null;
}

function stripBatiLines(commentBefore: string | null | undefined): string | undefined {
  const remaining = (commentBefore?.split("\n") ?? []).filter((l) => !isBatiLine(l)).join("\n");
  return remaining.trim() ? remaining : undefined;
}

// A comment before the first entry of a block mapping attaches to the map node's
// `commentBefore` instead of the first key. When it's a BATI guard, move it onto
// the first key so the regular Pair handling can evaluate (and possibly drop) it.
function hoistFirstEntryComment(node: YAMLMap): void {
  const first = node.items[0];
  if (!first || !isScalar(first.key) || first.key.commentBefore) return;
  if (extractBatiCondition(node.commentBefore) === null) return;
  first.key.commentBefore = node.commentBefore;
  node.commentBefore = undefined;
}

// Drops the node when its leading `# BATI...` comment evaluates falsy; otherwise
// strips the BATI line(s) and keeps any surrounding comment. Clearing the comment
// before removal stops it from re-attaching to the following sibling.
function resolveBatiComment(node: Node, meta: VikeMeta): typeof visit.REMOVE | undefined {
  const condition = extractBatiCondition(node.commentBefore);
  if (condition === null) return;

  if (!evalCondition(condition, meta)) {
    node.commentBefore = undefined;
    return visit.REMOVE;
  }
  node.commentBefore = stripBatiLines(node.commentBefore);
}

export function transformYaml(code: string, meta: VikeMeta): string {
  const doc = parseDocument(code);

  visit(doc, {
    // Map entries carry the conditional comment on their key.
    Pair(_key, node) {
      if (isScalar(node.key)) return resolveBatiComment(node.key, meta);
    },
    // Sequence items carry it on the item node itself (map or scalar).
    Map(_key, node, path) {
      if (isSeq(path[path.length - 1])) return resolveBatiComment(node, meta);
      // A comment before the *first* entry of a block mapping is parsed onto the
      // map's own `commentBefore`, not the first key — so the Pair visitor never
      // sees it. Hoist it down onto the first key so it's evaluated like any
      // other entry guard (visit() reaches that Pair after this Map node).
      hoistFirstEntryComment(node);
    },
    Scalar(_key, node, path) {
      if (isSeq(path[path.length - 1])) return resolveBatiComment(node, meta);
    },
  });

  return doc.toString();
}
