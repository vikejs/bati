import { BatiSet, features } from "@batijs/features";
import { afterEach, assert, beforeEach, describe, expect, test } from "vitest";
import { transformAndFormat } from "../src/index.js";
import { runCodemods } from "../src/parse/codemods.js";

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
    const filename = ctx.jsx ? "test-if.tsx" : "test-if.ts";
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet(["react"], features, "pnpm"),
        BATI_TEST: false,
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedIf);
  });

  if (expectedElseIf) {
    test("else-if", async () => {
      const filename = ctx.jsx ? "test-else-if.tsx" : "test-else-if.ts";
      const renderedOutput = await transformAndFormat(
        code,
        {
          BATI: new BatiSet(["solid"], features, "pnpm"),
          BATI_TEST: false,
        },
        { filepath: filename },
      );

      assert.equal(renderedOutput.code.trim(), expectedElseIf);
    });
  }

  test("else", async () => {
    const filename = ctx.jsx ? "test-else.tsx" : "test-else.ts";
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet([], features, "pnpm"),
        BATI_TEST: true,
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedElse);
  });
}

describe("ts: if block", () => {
  testIfElse(
    `if ($$.BATI.has("react")) {
    content = { ...content, jsx: "react" };
  }`,
    `content = { ...content, jsx: "react" };`,
    ``,
  );
});

describe("ts: if-else block", () => {
  testIfElse(
    `if ($$.BATI.has("react")) {
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
    `if ($$.BATI.has("react")) {
    content = { ...content, jsx: "react" };
  } else if ($$.BATI.has("solid")) {
    content = { ...content, jsx: "react-jsx", jsxImportSource: "solid-js" };
  } else {
    console.log("NOTHING TO DO");
  }`,
    `content = { ...content, jsx: "react" };`,
    `content = { ...content, jsx: "react-jsx", jsxImportSource: "solid-js" };`,
    `console.log("NOTHING TO DO");`,
  );
});

describe("ts: if-elseif-else statement", () => {
  testIfElse(
    `if ($$.BATI.has("react"))
    content = { ...content, jsx: "react" };
  else if ($$.BATI.has("solid"))
    content = { ...content, jsx: "react-jsx", jsxImportSource: "solid-js" };
  else
    console.log("NOTHING TO DO");`,
    `content = { ...content, jsx: "react" };`,
    `content = { ...content, jsx: "react-jsx", jsxImportSource: "solid-js" };`,
    `console.log("NOTHING TO DO");`,
  );
});

describe("ts: conditional", () => {
  testIfElse(
    `$$.BATI.has("react")
    ? 1
    : $$.BATI.has("solid")
    ? 2
    : null;`,
    `1;`,
    `2;`,
    `null;`,
  );
});

describe("ts: comment above import", () => {
  testIfElse(
    `// $$.BATI.has("react")
import "react";`,
    `import "react";`,
    ``,
  );
});

describe("ts: comment above comment", () => {
  testIfElse(
    `// $$.BATI.has("react")
/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    `/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    ``,
  );
});

describe("ts: keepCommentsIf", () => {
  testIfElse(
    `// $$.keepCommentsIf($$.BATI.has("react"))
/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    `/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    `const a = 1;`,
  );
});

describe("ts: comment in array", () => {
  testIfElse(
    `const a = [
  1,
  // $$.BATI.has("react")
  Object({
    a: 2,
  }),
  // $$.BATI.has("react")
  new Object({
    a: 3,
  }),
  // $$.BATI.has("react")
  {
    a: 4,
  },
];`,
    `const a = [
  1,
  Object({
    a: 2,
  }),
  new Object({
    a: 3,
  }),
  {
    a: 4,
  },
];`,
    `const a = [1];`,
  );

  testIfElse(
    `export default defineConfig({
  plugins: [
    // $$.BATI.has("react")
    process.env.NODE_ENV !== "production" ? hono() : undefined,
    // !$$.BATI.has("react")
    hono(),
  ],
});`,
    `export default defineConfig({
  plugins: [process.env.NODE_ENV !== "production" ? hono() : undefined],
});`,
    `export default defineConfig({
  plugins: [hono()],
});`,
  );
});

describe("ts: comment in object", () => {
  testIfElse(
    `const a = {
  // $$.BATI.has("react")
  key1: 1,
  // $$.BATI.has("react")
  key2: new Object({
    a: 2,
  }),
  key3: 3,
};`,
    `const a = {
  key1: 1,
  key2: new Object({
    a: 2,
  }),
  key3: 3,
};`,
    `const a = {
  key3: 3,
};`,
  );
});

describe("ts: comment in function args", () => {
  testIfElse(
    `export default tseslint.config(
  // $$.BATI.has("vue")
  VUE1,
  // $$.BATI.has("react")
  REACT1,
  // $$.BATI.has("react")
  ...REACT2,
  // $$.BATI.has("react")
  REACT3,
);`,
    `export default tseslint.config(REACT1, ...REACT2, REACT3);`,
    `export default tseslint.config();`,
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
      // $$.BATI.has("react")
      class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
      // !$$.BATI.has("react")
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
    <div id="sidebar" class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200">
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
      {$$.BATI.has("react") ? "a" : "b"}
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
      {$$.BATI.has("react") ? <MyComponentA /> : undefined}
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

describe("remove unused imports", async () => {
  testIfElse(
    `import { solid } from "solid";
import react from "react";

export const framework = $$.BATI.has("react")
? react()
: $$.BATI.has("solid")
? solid()
: null;`,
    `import react from "react";

export const framework = react();`,
    `import { solid } from "solid";

export const framework = solid();`,
    `export const framework = null;`,
  );
});

describe('rewrite "@batijs/" imports', async () => {
  test("simple", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = await transformAndFormat(
      `import { trpc } from "@batijs/trpc/trpc/client";

export const test = trpc;`,
      {
        BATI: new BatiSet([], features, "pnpm"),
      },
      { filepath: filename },
    );

    assert.equal(
      renderedOutput.code.trim(),
      `import { trpc } from "./trpc/client";

export const test = trpc;`,
    );
    assert.isTrue(renderedOutput.context?.imports.has("./trpc/client"));
  });

  test("With unused import", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = await transformAndFormat(
      `import { trpc } from "@batijs/trpc/trpc/client";

export const test = 1;`,
      {
        BATI: new BatiSet([], features, "pnpm"),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), `export const test = 1;`);
    assert.isFalse(renderedOutput.context?.imports.has("./trpc/client"));
  });
});

describe("global meta comments", async () => {
  const options = { filepath: "test.ts" };

  test("valid flags", async () => {
    const renderedOutput = await transformAndFormat(
      `/* $$.includeIfImported */      
const a = 1;`,
      {
        BATI: new BatiSet([], features, "pnpm"),
      },
      options,
    );

    assert.equal(renderedOutput.code.trim(), `const a = 1;`);
    assert.isTrue(renderedOutput.context?.flags.has("include-if-imported"));
  });
});

describe("BATI. expressions", () => {
  test("$$.Any", async () => {
    const renderedOutput = await transformAndFormat(
      `const a = "a" as $$.Any;`,
      {
        BATI: new BatiSet([], features, "pnpm"),
        BATI_TEST: false,
      },
      { filepath: "test-as.ts" },
    );

    assert.equal(renderedOutput.code.trim(), 'const a = "a";');
  });

  test("$$.Any with ()", async () => {
    const renderedOutput = await transformAndFormat(
      `const a = (options?.router || appRouter) as $$.Any;`,
      {
        BATI: new BatiSet([], features, "pnpm"),
        BATI_TEST: false,
      },
      { filepath: "test-as.ts" },
    );

    assert.equal(renderedOutput.code.trim(), "const a = options?.router || appRouter;");
  });

  testIfElse(
    `const a = "a" as $$.If<{ '$$.BATI.has("react")':string }>;`,
    `const a = "a" as string;`,
    `const a = "a";`,
  );

  testIfElse(`const a: $$.If<{ '$$.BATI.has("react")': string }> = "a";`, `const a: string = "a";`, `const a = "a";`);

  testIfElse(
    `const t = initTRPC
.context<
  $$.If<{
    '$$.BATI.has("react")': { env: { DB: D1Database } };
    _: object;
  }>
>()
.create();`,
    `const t = initTRPC.context<{ env: { DB: D1Database } }>().create();`,
    `const t = initTRPC.context<object>().create();`,
  );

  testIfElse(
    `declare global {
  namespace Universal {
    interface Context {
      db: $$.If<{
        '$$.BATI.has("react")': ReturnType<typeof sqliteDb>;
        _: object;
      }>;
    }
  }
}`,
    `declare global {
  namespace Universal {
    interface Context {
      db: ReturnType<typeof sqliteDb>;
    }
  }
}`,
    `declare global {
  namespace Universal {
    interface Context {
      db: object;
    }
  }
}`,
  );
});

describe("$$.BATI_TEST", () => {
  testIfElse(
    `if ($$.BATI_TEST) {
    content = "test";
  }`,
    ``,
    `content = "test";`,
  );
});

describe("$$.BATI_TEST + $$.BATI.has", () => {
  testIfElse(
    `if ($$.BATI_TEST || $$.BATI.has("react")) {
    content = "test";
  } else if ($$.BATI.has("solid")) {
    content = "solid";
  }`,
    `content = "test";`,
    `content = "solid";`,
    `content = "test";`,
  );
});

describe("$$.BATI_TEST: comment above import", () => {
  testIfElse(
    `// $$.BATI_TEST
import "react";`,
    ``,
    `import "react";`,
  );
});

describe("imports stripped by a BATI condition are not tracked", () => {
  // An `include-if-imported` target relies on the import graph (`context.imports`)
  // to decide whether to keep a file. A side-effect import gated by a falsy BATI
  // condition is removed from the code, so it must also be removed from the graph
  // — otherwise the imported file is wrongly kept (and later flagged unused).
  const code = `// $$.BATI.has("react")
import "@batijs/shared-env/server/load";
export const x = 1;`;

  test("dropped from the graph when the condition is false", async () => {
    const meta = { BATI: new BatiSet([], features, "pnpm"), BATI_TEST: false };
    const { code: output, context } = await runCodemods(code, meta, "test.ts");

    expect(output).not.toContain("shared-env");
    expect(output).not.toContain("server/load");
    expect([...context.imports]).not.toContain("./server/load");
  });

  test("kept in the graph when the condition is true", async () => {
    const meta = { BATI: new BatiSet(["react"], features, "pnpm"), BATI_TEST: false };
    const { code: output, context } = await runCodemods(code, meta, "test.ts");

    expect(output).toContain(`import "./server/load";`);
    expect([...context.imports]).toContain("./server/load");
  });

  // The `include-if-imported` flag sits a blank line above the gated first import (as in
  // database/kysely/db.ts), which detaches it from the import's leading comments. The flag must still
  // be recorded and the import dropped from the graph — otherwise the imported file is wrongly kept.
  const codeWithGlobalComment = `/* $$.includeIfImported */

// $$.BATI.has("react")
import "@batijs/shared-env/server/load";
export const x = 1;`;

  test("dropped from the graph even when hidden behind a global comment", async () => {
    const meta = { BATI: new BatiSet([], features, "pnpm"), BATI_TEST: false };
    const { code: output, context } = await runCodemods(codeWithGlobalComment, meta, "test.ts");

    expect(output).not.toContain("server/load");
    expect([...context.imports]).not.toContain("./server/load");
  });
});
