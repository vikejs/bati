import { afterEach, assert, beforeEach, describe, test } from "vitest";
import { transformAndFormat } from "../src/index.js";
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
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new Set(["react"]),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.trim(), expectedIf);
  });

  if (expectedElseIf) {
    test("else-if", async () => {
      const filename = ctx.jsx ? "test.tsx" : "test.ts";
      const renderedOutput = await transformAndFormat(
        code,
        {
          BATI: new Set(["solid"]),
        },
        { filepath: filename },
      );

      assert.equal(renderedOutput.trim(), expectedElseIf);
    });
  }

  test("else", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new Set(),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.trim(), expectedElse);
  });
}

describe("ts: if block", () => {
  testIfElse(
    `if (BATI.has("react")) {
    content = { ...content, jsx: "react" };
  }`,
    `content = { ...content, jsx: "react" };`,
    ``,
  );
});

describe("ts: if-else block", () => {
  testIfElse(
    `if (BATI.has("react")) {
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
    `if (BATI.has("react")) {
    content = { ...content, jsx: "react" };
  } else if (BATI.has("solid")) {
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
    `if (BATI.has("react"))
    content = { ...content, jsx: "react" };
  else if (BATI.has("solid"))
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
    `BATI.has("react")
    ? 1
    : BATI.has("solid")
    ? 2
    : null;`,
    `1;`,
    `2;`,
    `null;`,
  );
});

describe("ts: comments", () => {
  testIfElse(
    `//# BATI.has("react")
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
      //# BATI.has("react")
      class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
      //# !BATI.has("react")
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

describe("ts: jsx conditional", () => {
  beforeEach(() => {
    ctx.jsx = true;
  });

  testIfElse(
    `const x = () => {
  return (
    <div>
      {BATI.has("react") ? "a" : "b"}
    </div>
  );
};`,
    `const x = () => {
  return <div>{"a"}</div>;
};`,
    `const x = () => {
  return <div>{"b"}</div>;
};`,
  );
});

describe("ts: jsx conditional with component", () => {
  beforeEach(() => {
    ctx.jsx = true;
  });

  testIfElse(
    `const x = () => {
  return (
    <div>
      {BATI.has("react") ? <MyComponentA /> : undefined}
    </div>
  );
};`,
    `const x = () => {
  return (
    <div>
      <MyComponentA />
    </div>
  );
};`,
    `const x = () => {
  return <div></div>;
};`,
  );
});

test("ts: if throws", () => {
  assert.throws(
    () =>
      transform(
        `if (BATI.has(someVar)) {
    content = { ...content, jsx: "react" };
  }`,
        "test.ts",
        {
          BATI: new Set(["react"]),
        },
      ),
    ReferenceError,
  );
});

describe("remove unused imports", async () => {
  testIfElse(
    `import { solid } from "solid";
import react from "react";

export const framework = BATI.has("react")
? react()
: BATI.has("solid")
? solid()
: null;`,
    `import react from "react";

export const framework = react();`,
    `import { solid } from "solid";

export const framework = solid();`,
    `export const framework = null;`,
  );
});
