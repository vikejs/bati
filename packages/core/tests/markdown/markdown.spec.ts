import { expect, test } from "vitest";

import { type MarkdownPosition, parseMarkdown } from "../../src/markdown/markdown.js";

test.skip("simple", () => {
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

test.skip.each([
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

test.skip("wrapper", () => {
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

test.skip("empty document", () => {
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
    wrapper: {
      category: "Frontend Framework",
      flag: "react",
    },
  });

  const result = content.finalize();
  console.log(result);
  expect(result).toBe(
    `<!--bati:start section="document"-->

<!--bati:start section="features"-->

<!--bati:start category="Frontend Framework" flag="react"-->

## REACT

<!--bati:end category="Frontend Framework" flag="react"-->

<!--bati:start category="Hosting" flag="aws"-->

## AWS

<!--bati:end category="Hosting" flag="aws"-->

<!--bati:end section="features"-->

<!--bati:end section="document"-->
`,
  );
});
