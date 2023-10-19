import { afterEach, assert, beforeEach, describe, test } from "vitest";
import { formatCode } from "../src/format.js";
import { transform } from "../src/parse/linters/index.js";

const ctx = { jsx: false };

afterEach(() => {
  ctx.jsx = false;
});

function testIfElse(code: string, expectedIf: string, expectedElse: string): void;
function testIfElse(code: string, expectedIf: string, expectedElseIf: string, expectedElse: string): void;
function testIfElse(code: string, expectedIf: string, expectedElseIf?: string, expectedElse?: string) {
  if (!expectedElse) {
    expectedElse = expectedElseIf;
    expectedElseIf = undefined;
  }

  test("if", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = transform(code, filename, {
      BATI_MODULES: ["react"],
    });

    assert.equal((await formatCode(renderedOutput, { filepath: filename })).trim(), expectedIf);
  });

  if (expectedElseIf) {
    test("else-if", async () => {
      const filename = ctx.jsx ? "test.tsx" : "test.ts";
      const renderedOutput = transform(code, filename, {
        BATI_MODULES: ["solid"],
      });

      assert.equal((await formatCode(renderedOutput, { filepath: filename })).trim(), expectedElseIf);
    });
  }

  test("else", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = transform(code, filename, {
      BATI_MODULES: [],
    });

    assert.equal((await formatCode(renderedOutput, { filepath: filename })).trim(), expectedElse);
  });
}

describe("ts: if block", () => {
  testIfElse(
    `if (import.meta.BATI_MODULES.includes("react")) {
    content = { ...content, jsx: "react" };
  }`,
    `content = { ...content, jsx: "react" };`,
    ``,
  );
});

describe("ts: if-else block", () => {
  testIfElse(
    `if (import.meta.BATI_MODULES.includes("react")) {
    content = { ...content, jsx: "react" };
  } else {
    console.log("NOTHING TO DO");
  }`,
    `content = { ...content, jsx: "react" };`,
    `console.log("NOTHING TO DO");`,
  );
});

describe("ts: if-elseif-else block", () => {
  testIfElse(
    `if (import.meta.BATI_MODULES.includes("react")) {
    content = { ...content, jsx: "react" };
  } else if (import.meta.BATI_MODULES.includes("solid")) {
    content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
  } else {
    console.log("NOTHING TO DO");
  }`,
    `content = { ...content, jsx: "react" };`,
    `content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };`,
    `console.log("NOTHING TO DO");`,
  );
});

describe("ts: if-elseif-else statement", () => {
  testIfElse(
    `if (import.meta.BATI_MODULES.includes("react"))
    content = { ...content, jsx: "react" };
  else if (import.meta.BATI_MODULES.includes("solid"))
    content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
  else
    console.log("NOTHING TO DO");`,
    `content = { ...content, jsx: "react" };`,
    `content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };`,
    `console.log("NOTHING TO DO");`,
  );
});

describe("ts: conditional", () => {
  testIfElse(
    `import.meta.BATI_MODULES.includes("react")
    ? 1
    : import.meta.BATI_MODULES.includes("solid")
    ? 2
    : null;`,
    `1;`,
    `2;`,
    `null;`,
  );
});

describe("ts: comments", () => {
  testIfElse(
    `//# import.meta.BATI_MODULES?.includes("react")
import "react";`,
    `import "react";`,
    ``,
  );
});

describe("ts: jsx comments", () => {
  beforeEach(() => {
    ctx.jsx = true;
  });

  testIfElse(
    `const x = () => {
  return (
    <div
      id="sidebar"
      //# import.meta.BATI_MODULES?.includes("react")
      class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
      //# !import.meta.BATI_MODULES?.includes("react")
      style={{
        padding: "20px",
        "flex-shrink": 0,
        display: "flex",
        "flex-direction": "column",
        "line-height": "1.8em",
        "border-right": "2px solid #eee",
      }}
    >
      {props.children}
    </div>
  );
};`,
    `const x = () => {
  return (
    <div
      id="sidebar"
      class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
    >
      {props.children}
    </div>
  );
};`,
    `const x = () => {
  return (
    <div
      id="sidebar"
      style={{
        padding: "20px",
        "flex-shrink": 0,
        display: "flex",
        "flex-direction": "column",
        "line-height": "1.8em",
        "border-right": "2px solid #eee",
      }}
    >
      {props.children}
    </div>
  );
};`,
  );
});

test("ts: if throws", () => {
  assert.throws(
    () =>
      transform(
        `if (import.meta.BATI_MODULES.includes(someVar)) {
    content = { ...content, jsx: "react" };
  }`,
        "test.ts",
        {
          BATI_MODULES: ["react"],
        },
      ),
    ReferenceError,
  );
});

describe("remove unused imports", async () => {
  testIfElse(
    `import { solid } from "solid";
import react from "react";

export const framework = import.meta.BATI_MODULES.includes("react")
? react()
: import.meta.BATI_MODULES.includes("solid")
? solid()
: null;`,
    `import react from "react";

export const framework = react();`,
    `import { solid } from "solid";

export const framework = solid();`,
    `export const framework = null;`,
  );
});
