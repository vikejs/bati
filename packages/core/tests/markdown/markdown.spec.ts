import { expect, test } from "vitest";

import { parseMarkdown } from "../../src/markdown/markdown.js";
import type { MarkdownPosition } from "../../src/markdown/types.js";

test("simple", () => {
  const content = parseMarkdown(`
<!--bati:start category="Linter"-->
<!--bati:end category="Linter"-->
<!--bati:start category="Error tracking"-->
<!--bati:end category="Error tracking"-->
`);
  content.addMarkdown(`# Sentry`, {
    filter: {
      category: "Error tracking",
      //flag: "sentry",
    },
  });

  const result = content.finalize();
  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start category="Linter"-->

<!--bati:end category="Linter"-->

<!--bati:start category="Error tracking"-->

# Sentry

<!--bati:end category="Error tracking"-->

<!--bati:end section="document"-->
`,
  );
});

test.each([
  ["replace", "# replace"],
  ["before", "# before\n\n# content"],
  ["after", "# content\n\n# after"],
])("position: %s", (position, expected) => {
  const content = parseMarkdown(
    `<!--bati:start category="Error tracking"-->
# content
<!--bati:end category="Error tracking"-->
`,
  );
  content.addMarkdown(`# ${position}`, {
    filter: {
      category: "Error tracking",
    },
    position: position as MarkdownPosition,
  });

  const result = content.finalize();

  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start category="Error tracking"-->

${expected}

<!--bati:end category="Error tracking"-->

<!--bati:end section="document"-->
`,
  );
});

test("wrapper", () => {
  const content = parseMarkdown(
    `<!--bati:start category="Error tracking"-->
# content
<!--bati:end category="Error tracking"-->
`,
  );
  content.addMarkdown(`# new content`, {
    filter: {
      category: "Error tracking",
    },
    position: "before",
    wrapper: { category: "Error tracking", flag: "sentry" },
  });

  const result = content.finalize();
  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start category="Error tracking"-->

<!--bati:start category="Error tracking" flag="sentry"-->

# new content

<!--bati:end category="Error tracking" flag="sentry"-->

# content

<!--bati:end category="Error tracking"-->

<!--bati:end section="document"-->
`,
  );
});

test("empty document", () => {
  const content = parseMarkdown(``);
  content.addMarkdown(`# new content`, {
    filter: {
      section: "document",
    },
    position: "after",
    wrapper: { category: "Error tracking", flag: "sentry" },
  });

  const result = content.finalize();

  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start category="Error tracking" flag="sentry"-->

# new content

<!--bati:end category="Error tracking" flag="sentry"-->

<!--bati:end section="document"-->
`,
  );
});

test("add feature", () => {
  const content = parseMarkdown(`
<!--bati:start section="features"-->
<!--bati:start category="Hosting" flag="aws"-->
## AWS
<!--bati:end category="Hosting" flag="aws"-->
<!--bati:end section="features"-->
`);
  content.addMarkdown(`## REACT`, {
    filter: {
      section: "features",
    },
    wrapper: {
      category: "UI Framework",
      flag: "react",
    },
  });

  const result = content.finalize();

  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start section="features"-->

<!--bati:start category="UI Framework" flag="react"-->

## REACT

<!--bati:end category="UI Framework" flag="react"-->

<!--bati:start category="Hosting" flag="aws"-->

## AWS

<!--bati:end category="Hosting" flag="aws"-->

<!--bati:end section="features"-->

<!--bati:end section="document"-->
`,
  );
});

test("add feature with addMarkdownFeature", () => {
  const content = parseMarkdown(
    `
<!--bati:start section="features"-->
<!--bati:start category="Hosting" flag="aws"-->
## AWS
<!--bati:end category="Hosting" flag="aws"-->
<!--bati:end section="features"-->
`,
  );
  content.addMarkdownFeature(`## REACT`, "react");

  const result = content.finalize();

  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start section="features"-->

<!--bati:start category="UI Framework" flag="react"-->

## REACT

<!--bati:end category="UI Framework" flag="react"-->

<!--bati:start category="Hosting" flag="aws"-->

## AWS

<!--bati:end category="Hosting" flag="aws"-->

<!--bati:end section="features"-->

<!--bati:end section="document"-->
`,
  );
});

test("add TOC", () => {
  const content = parseMarkdown(
    `# README
<!--bati:start section="document"-->
<!--bati:start section="intro"-->

Intro

<!--bati:start section="TOC"-->
<!--bati:end section="TOC"-->
<!--bati:end section="intro"-->
<!--bati:start section="features"-->
<!--bati:start flag="react" category="UI Framework"-->
## React

### Rendering
<!--bati:end flag="react" category="UI Framework"-->
<!--bati:start flag="aws" category="Hosting"-->
## *AWS*

### S3
<!--bati:end flag="aws" category="Hosting"-->
<!--bati:start flag="sentry" category="Error tracking"-->
## Sentry

### Debugging
<!--bati:end flag="sentry" category="Error tracking"-->
<!--bati:end section="features"-->

`,
  );

  const result = content.finalize();

  expect(result).toBe(`# README

<!--bati:start section="document"-->

<!--bati:start section="intro"-->

Intro

<!--bati:start section="TOC"-->

## Contents

* [React](#react)

  * [Rendering](#rendering)

* [*AWS*](#aws)

  * [S3](#s3)

* [Sentry](#sentry)

  * [Debugging](#debugging)

<!--bati:end section="TOC"-->

<!--bati:end section="intro"-->

<!--bati:start section="features"-->

<!--bati:start flag="react" category="UI Framework"-->

## React

### Rendering

<!--bati:end flag="react" category="UI Framework"-->

<!--bati:start flag="aws" category="Hosting"-->

## *AWS*

### S3

<!--bati:end flag="aws" category="Hosting"-->

<!--bati:start flag="sentry" category="Error tracking"-->

## Sentry

### Debugging

<!--bati:end flag="sentry" category="Error tracking"-->

<!--bati:end section="features"-->
`);
});
