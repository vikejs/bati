import type { RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { expect, test } from "vitest";
import { createTOC } from "../../src/markdown/createTOC.js";

const markdownTree = fromMarkdown(`
# 001 h1

## 002 h2

### 003 h3

## 004 h2

### 005 h3

#### 006 h4

# 007 h1
`);

test("simple", () => {
  const result = createTOC(markdownTree);
  const markdown = toMarkdown(
    { type: "root", children: result as RootContent[] },
    {
      listItemIndent: "one",
      incrementListMarker: false,
    },
  );
  expect(markdown).toBe(
    `## Contents

* [002 h2](#002-h2)

* [003 h3](#003-h3)

* [004 h2](#004-h2)

* [005 h3](#005-h3)

* [006 h4](#006-h4)
`,
  );
});

test("ignore section TOC", () => {
  const mdast = fromMarkdown(`
<!--bati:start section="TOC"-->
## Contents
<!--bati:end section="TOC"-->
## Headline
      `);
  const result = createTOC(mdast);
  const markdown = toMarkdown(
    { type: "root", children: result as RootContent[] },
    {
      listItemIndent: "one",
      incrementListMarker: false,
    },
  );
  expect(markdown).toBe(
    `## Contents

* [Headline](#headline)
`,
  );
});
