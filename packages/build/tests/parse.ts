import { suite } from "uvu";
import * as assert from "uvu/assert";
import { ast, transformAst } from "../src/parse";
import { assertEquivalentAst } from "../src/testUtils";

function testAst(code: string, meta: Omit<ImportMeta, "url">) {
  const tree = ast(expected(code));

  return transformAst(tree, meta);
}

function expected(code: string) {
  return `const a: number = 1;
${code}
const b = 2;`;
}

const Suite = suite("transformAst");

Suite("===:react", () => {
  const tree = testAst(
    `if (import.meta.VIKE_FRAMEWORK === "react") {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_FRAMEWORK: "react",
    }
  );

  assertEquivalentAst(
    tree,
    ast(
      expected(`
      content = {
        ...content,
        jsx: "react"
      };
    `)
    )
  );
});

Suite("===:solid", () => {
  const tree = testAst(
    `if (import.meta.VIKE_FRAMEWORK === "react") {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_FRAMEWORK: "solid",
    }
  );

  assertEquivalentAst(tree, ast(expected(``)));
});

Suite("includes:react", () => {
  const tree = testAst(
    `if (["react"].includes(import.meta.VIKE_FRAMEWORK!)) {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_FRAMEWORK: "react",
    }
  );

  assertEquivalentAst(
    tree,
    ast(
      expected(`
      content = {
        ...content,
        jsx: "react"
      };
    `)
    )
  );
});

Suite("includes:solid", () => {
  const tree = testAst(
    `if (["react"].includes(import.meta.VIKE_FRAMEWORK!)) {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_FRAMEWORK: "solid",
    }
  );

  assertEquivalentAst(tree, ast(expected(``)));
});

Suite("external variable", () => {
  assert.throws(
    () =>
      testAst(
        `if (import.meta.VIKE_FRAMEWORK === someVar) {
    content = { ...content, jsx: "react" };
  }`,
        {
          VIKE_FRAMEWORK: "react",
        }
      ),
    (err: unknown) => err instanceof ReferenceError
  );
});

Suite.run();
