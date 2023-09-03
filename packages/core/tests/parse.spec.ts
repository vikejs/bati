import { assert, test } from "vitest";
import { parseModule } from "magicast";
import { transformAndGenerate, transformAst } from "../src/parse.js";
import { assertEquivalentAst } from "../src/testUtils.js";
import type { VikeMeta } from "../src/types.js";

function ast(code: string) {
  return parseModule(code).$ast;
}

function testAst(code: string, meta: VikeMeta) {
  const tree = ast(code);

  return transformAst(tree, meta);
}

test("includes:react", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("framework:react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      BATI_MODULES: ["framework:react"],
    },
  );

  assertEquivalentAst(
    tree,
    ast(
      `
      content = {
        ...content,
        jsx: "react"
      };
    `,
    ),
  );
});

test("includes:solid", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("framework:react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      BATI_MODULES: ["framework:solid"],
    },
  );

  assertEquivalentAst(tree, ast(""));
});

test("if-elseif-else:react", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["framework:react"],
    },
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "react" };`));
});

test("if-elseif-else:solid", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["framework:solid"],
    },
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };`));
});

test("if-elseif-else:other", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["framework:vue"],
    },
  );

  assertEquivalentAst(tree, ast(`console.log('NOTHING TO DO');`));
});

test("external variable", () => {
  assert.throws(
    () =>
      testAst(
        `if (import.meta.BATI_MODULES.includes(someVar)) {
    content = { ...content, jsx: "react" };
  }`,
        {
          BATI_MODULES: ["framework:react"],
        },
      ),
    ReferenceError,
  );
});

test("ternary:react", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("framework:react")
    ? 1
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["framework:react"],
    },
  );

  assertEquivalentAst(tree, ast(`1`));
});

test("ternary:solid", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("framework:react")
    ? 1
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["framework:solid"],
    },
  );

  assertEquivalentAst(tree, ast(`2`));
});

test("ternary:other", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("framework:react")
    ? 1
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["framework:vue"],
    },
  );

  assertEquivalentAst(tree, ast(`null`));
});

test("import cleanup:react", async () => {
  const code = await transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("framework:react")
    ? react()
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["framework:react"],
    },
  );

  assertEquivalentAst(
    ast(code),
    ast(
      `import react from 'react';
    export const framework = react();`,
    ),
  );
});

test("import cleanup:solid", async () => {
  const code = await transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("framework:react")
    ? react()
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["framework:solid"],
    },
  );

  assertEquivalentAst(
    ast(code),
    ast(
      `import { solid } from 'solid';
    export const framework = solid();`,
    ),
  );
});

test("import cleanup:other", async () => {
  const code = await transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("framework:react")
    ? react()
    : import.meta.BATI_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["framework:vue"],
    },
  );

  assertEquivalentAst(ast(code), ast(`export const framework = null;`));
});

test("import cleanup:keep global import", async () => {
  const code = await transformAndGenerate(
    ast(
      `
    import { a, b } from 'solid';
        
    export const x = a;
    `,
    ),
    {},
  );

  assertEquivalentAst(
    ast(code),
    ast(`
    import { a } from 'solid';
        
    export const x = a;
    `),
  );
});

test.only("import no cleanup:type", async () => {
  const code = await transformAndGenerate(
    ast(
      `
    import { type JSX, type Element } from 'solid';
        
    export const element1: JSX.Element = <></>;
    export const element2: Element = <></>;
    `,
    ),
    {},
  );

  assertEquivalentAst(
    ast(code),
    ast(`
    import { type JSX, type Element } from 'solid';
        
    export const element1: JSX.Element = <></>;
    export const element2: Element = <></>;
    `),
  );
});

test("remove BATI_REMOVE", () => {
  const tree = transformAst(ast(`const a = [import.meta.BATI_REMOVE, 'a']`), {
    BATI_MODULES: ["framework:vue"],
  });

  assertEquivalentAst(tree, ast(`const a = ['a']`));
});

test("remove comment preceding import", () => {
  const tree = transformAst(
    ast(`
//# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
import "./tailwind.css";`),
    {
      BATI_MODULES: ["uikit:tailwindcss"],
    },
  );

  assertEquivalentAst(tree, ast(`import "./tailwind.css";`));
});

test("remove comment preceding import and import itself", () => {
  const tree = transformAst(
    ast(`
//# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
import "./tailwind.css";`),
    {
      BATI_MODULES: [],
    },
  );

  assertEquivalentAst(tree, ast(``));
});

test("remove comment preceding JSX attribute", () => {
  const tree = transformAst(
    ast(`
<div
  id="sidebar"
  //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
  class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
  //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
  style={{
    padding: "20px",
    "flex-shrink": 0,
    display: "flex",
    "flex-direction": "column",
    "line-height": "1.8em",
    "border-right": "2px solid #eee"
  }}
>
  {props.children}
</div>`),
    {
      BATI_MODULES: [],
    },
  );

  assertEquivalentAst(
    tree,
    ast(`
<div
  id="sidebar"
  style={{
    padding: "20px",
    "flex-shrink": 0,
    display: "flex",
    "flex-direction": "column",
    "line-height": "1.8em",
    "border-right": "2px solid #eee"
  }}
>
  {props.children}
</div>`),
  );
});

test("remove comment preceding JSX attribute", () => {
  const tree = transformAst(
    ast(`
<div
  id="sidebar"
  //# import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
  class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
  //# !import.meta.BATI_MODULES?.includes("uikit:tailwindcss")
  style={{
    padding: "20px",
    "flex-shrink": 0,
    display: "flex",
    "flex-direction": "column",
    "line-height": "1.8em",
    "border-right": "2px solid #eee"
  }}
>
  {props.children}
</div>`),
    {
      BATI_MODULES: ["uikit:tailwindcss"],
    },
  );

  assertEquivalentAst(
    tree,
    ast(`
<div
  id="sidebar"
  class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
>
  {props.children}
</div>`),
  );
});
