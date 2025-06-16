import { afterEach, assert, beforeEach, describe, expect, test } from "vitest";
import { transformAndFormat } from "../src/index.js";
import { transform } from "../src/parse/linters/index.js";
import { BatiSet, features } from "@batijs/features";

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
        BATI: new BatiSet(["react"], features),
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
          BATI: new BatiSet(["solid"], features),
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
        BATI: new BatiSet([], features),
        BATI_TEST: true,
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedElse);
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
    `if (BATI.has("react"))
    content = { ...content, jsx: "react" };
  else if (BATI.has("solid"))
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

describe("ts: comment above import", () => {
  testIfElse(
    `//# BATI.has("react")
import "react";`,
    `import "react";`,
    ``,
  );
});

describe("ts: comment above comment", () => {
  testIfElse(
    `//# BATI.has("react")
/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    `/// <reference types="vite-plugin-vercel/types" />
const a = 1;`,
    ``,
  );
});

describe("ts: remove-comments-only", () => {
  testIfElse(
    `//# BATI.has("react") || "remove-comments-only"
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
  //# BATI.has("react")
  Object({
    a: 2,
  }),
  //# BATI.has("react")
  new Object({
    a: 3,
  }),
  //# BATI.has("react")
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
    //# BATI.has("react")
    process.env.NODE_ENV !== "production" ? hono() : undefined,
    //# !BATI.has("react")
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
  //# BATI.has("react")
  key1: 1,
  //# BATI.has("react")
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
  //# BATI.has("vue")
  VUE1,
  //# BATI.has("react")
  REACT1,
  //# BATI.has("react")
  ...REACT2,
  //# BATI.has("react")
  REACT3,
);`,
    `export default tseslint.config(
  REACT1,

  ...REACT2,

  REACT3,
);`,
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
          BATI: new BatiSet(["react"], features),
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

describe('rewrite "@batijs/" imports', async () => {
  test("simple", async () => {
    const filename = ctx.jsx ? "test.tsx" : "test.ts";
    const renderedOutput = await transformAndFormat(
      `import { trpc } from "@batijs/trpc/trpc/client";

export const test = trpc;`,
      {
        BATI: new BatiSet([], features),
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
        BATI: new BatiSet([], features),
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
      `/*# BATI include-if-imported #*/      
const a = 1;`,
      {
        BATI: new BatiSet([], features),
      },
      options,
    );

    assert.equal(renderedOutput.code.trim(), `const a = 1;`);
    assert.isTrue(renderedOutput.context?.flags.has("include-if-imported"));
  });

  test("invalid flags", async () => {
    await expect(
      transformAndFormat(
        `/*# BATI invalid #*/      
const a = 1;`,
        {
          BATI: new BatiSet([], features),
        },
        options,
      ),
    ).rejects.toThrow(`Unknown BATI file flag invalid`);
  });

  test("mix valid and invalid flags", async () => {
    await expect(
      transformAndFormat(
        `/*# BATI include-if-imported,invalid #*/      
const a = 1;`,
        {
          BATI: new BatiSet([], features),
        },
        options,
      ),
    ).rejects.toThrow(`Unknown BATI file flag invalid`);
  });
});

describe("BATI. expressions", () => {
  test("BATI.Any", async () => {
    const renderedOutput = await transformAndFormat(
      `const a = "a" as BATI.Any;`,
      {
        BATI: new BatiSet([], features),
        BATI_TEST: false,
      },
      { filepath: "test-as.ts" },
    );

    assert.equal(renderedOutput.code.trim(), 'const a = "a";');
  });

  test("BATI.Any with ()", async () => {
    const renderedOutput = await transformAndFormat(
      `const a = (options?.router || appRouter) as BATI.Any;`,
      {
        BATI: new BatiSet([], features),
        BATI_TEST: false,
      },
      { filepath: "test-as.ts" },
    );

    assert.equal(renderedOutput.code.trim(), "const a = options?.router || appRouter;");
  });

  testIfElse(
    `const a = "a" as BATI.If<{ 'BATI.has("react")': { env: string } }>;`,
    `const a = "a" as { env: string };`,
    `const a = "a";`,
  );

  testIfElse(
    `const t = initTRPC
.context<
  BATI.If<{
    'BATI.has("react")': { env: { DB: D1Database } };
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
      db: BATI.If<{
        'BATI.has("react")': ReturnType<typeof sqliteDb>;
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

describe("BATI_TEST", () => {
  testIfElse(
    `if (BATI_TEST) {
    content = "test";
  }`,
    ``,
    `content = "test";`,
  );
});

describe("BATI_TEST + BATI.has", () => {
  testIfElse(
    `if (BATI_TEST || BATI.has("react")) {
    content = "test";
  } else if (BATI.has("solid")) {
    content = "solid";
  }`,
    `content = "test";`,
    `content = "solid";`,
    `content = "test";`,
  );
});

describe("BATI_TEST: comment above import", () => {
  testIfElse(
    `//# BATI_TEST
import "react";`,
    ``,
    `import "react";`,
  );
});
