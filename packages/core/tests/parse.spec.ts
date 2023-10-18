import { parseModule } from "magicast";
import { assert, test } from "vitest";
import { transformAst, transformAstAndGenerate } from "../src/parse.js";
import { transform } from "../src/parse/linters/index.js";
import { assertEquivalentAst } from "../src/testUtils.js";
import type { VikeMeta } from "../src/types.js";

function ast(code: string) {
  return parseModule(code).$ast;
}

function testAst(code: string, meta: VikeMeta) {
  const tree = ast(code);

  return transformAst(tree, meta);
}

test("ast includes:react", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      BATI_MODULES: ["react"],
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

test("ast includes:solid", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      BATI_MODULES: ["solid"],
    },
  );

  assertEquivalentAst(tree, ast(""));
});

test("ast if-elseif-else:react", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["react"],
    },
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "react" };`));
});

test("ast if-elseif-else:solid", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["solid"],
    },
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };`));
});

test("ast if-elseif-else:other", () => {
  const tree = testAst(
    `if (import.meta.BATI_MODULES.includes("react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.BATI_MODULES.includes("solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      BATI_MODULES: ["vue"],
    },
  );

  assertEquivalentAst(tree, ast(`console.log('NOTHING TO DO');`));
});

test("ast external variable", () => {
  assert.throws(
    () =>
      testAst(
        `if (import.meta.BATI_MODULES.includes(someVar)) {
    content = { ...content, jsx: "react" };
  }`,
        {
          BATI_MODULES: ["react"],
        },
      ),
    ReferenceError,
  );
});

test("ast ternary:react", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("react")
    ? 1
    : import.meta.BATI_MODULES.includes("solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["react"],
    },
  );

  assertEquivalentAst(tree, ast(`1`));
});

test("ast ternary:solid", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("react")
    ? 1
    : import.meta.BATI_MODULES.includes("solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["solid"],
    },
  );

  assertEquivalentAst(tree, ast(`2`));
});

test("ast ternary:other", () => {
  const tree = testAst(
    `import.meta.BATI_MODULES.includes("react")
    ? 1
    : import.meta.BATI_MODULES.includes("solid")
    ? 2
    : null`,
    {
      BATI_MODULES: ["vue"],
    },
  );

  assertEquivalentAst(tree, ast(`null`));
});

test("ast import cleanup:react", async () => {
  const code = await transformAstAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("react")
    ? react()
    : import.meta.BATI_MODULES.includes("solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["react"],
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

test("ast import cleanup:solid", async () => {
  const code = await transformAstAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("react")
    ? react()
    : import.meta.BATI_MODULES.includes("solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["solid"],
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

test("ast import cleanup:other", async () => {
  const code = await transformAstAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    export const framework = import.meta.BATI_MODULES.includes("react")
    ? react()
    : import.meta.BATI_MODULES.includes("solid")
    ? solid()
    : null;
    `,
    ),
    {
      BATI_MODULES: ["vue"],
    },
  );

  assertEquivalentAst(ast(code), ast(`export const framework = null;`));
});

test("ast remove BATI_REMOVE", () => {
  const tree = transformAst(ast(`const a = [import.meta.BATI_REMOVE, 'a']`), {
    BATI_MODULES: ["vue"],
  });

  assertEquivalentAst(tree, ast(`const a = ['a']`));
});

test("ast remove comment preceding import", () => {
  const tree = transformAst(
    ast(`
//# import.meta.BATI_MODULES?.includes("tailwindcss")
import "./tailwind.css";`),
    {
      BATI_MODULES: ["tailwindcss"],
    },
  );

  assertEquivalentAst(tree, ast(`import "./tailwind.css";`));
});

test("ast remove comment preceding import and import itself", () => {
  const tree = transformAst(
    ast(`
//# import.meta.BATI_MODULES?.includes("tailwindcss")
import "./tailwind.css";`),
    {
      BATI_MODULES: [],
    },
  );

  assertEquivalentAst(tree, ast(``));
});

test("ast remove comment preceding JSX attribute", () => {
  const tree = transformAst(
    ast(`
<div
  id="sidebar"
  //# import.meta.BATI_MODULES?.includes("tailwindcss")
  class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
  //# !import.meta.BATI_MODULES?.includes("tailwindcss")
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

test("ast remove comment preceding JSX attribute", () => {
  const tree = transformAst(
    ast(`
<div
  id="sidebar"
  //# import.meta.BATI_MODULES?.includes("tailwindcss")
  class="p-5 flex flex-col shrink-0 border-r-2 border-r-gray-200"
  //# !import.meta.BATI_MODULES?.includes("tailwindcss")
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
      BATI_MODULES: ["tailwindcss"],
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

test("vue/template: if telefunc", async () => {
  const renderedOutput = transform(
    `
<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">Welcome</Link>
      <!-- import.meta.BATI_MODULES?.includes("telefunc") -->
      <Link href="/todo">Todo</Link>
      <Link href="/star-wars">Data Fetching</Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>`,
    "test.vue",
    {
      BATI_MODULES: ["tailwindcss", "telefunc"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">Welcome</Link>
      
      <Link href="/todo">Todo</Link>
      <Link href="/star-wars">Data Fetching</Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>`,
  );
});

test("vue/template: if not telefunc", async () => {
  const renderedOutput = transform(
    `
<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">Welcome</Link>
      <!-- import.meta.BATI_MODULES?.includes("telefunc") -->
      <Link href="/todo">Todo</Link>
      <Link href="/star-wars">Data Fetching</Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>`,
    "test.vue",
    {
      BATI_MODULES: ["tailwindcss"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<template>
  <div class="layout">
    <Sidebar>
      <Logo />
      <Link href="/">Welcome</Link>
      
      
      <Link href="/star-wars">Data Fetching</Link>
    </Sidebar>
    <Content><slot /></Content>
  </div>
</template>`,
  );
});

test("vue/template-conditional: if telefunc", async () => {
  const renderedOutput = transform(
    `
<template>
  <div class="layout">
    {{ import.meta.BATI_MODULES?.includes("telefunc") ? 'a' : 'b' }}
  </div>
</template>`,
    "test.vue",
    {
      BATI_MODULES: ["tailwindcss", "telefunc"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<template>
  <div class="layout">
    {{ 'a' }}
  </div>
</template>`,
  );
});

test("vue/template-conditional: if not telefunc", async () => {
  const renderedOutput = transform(
    `
<template>
  <div class="layout">
    {{ import.meta.BATI_MODULES?.includes("telefunc") ? 'a' : 'b' }}
  </div>
</template>`,
    "test.vue",
    {
      BATI_MODULES: ["tailwindcss"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<template>
  <div class="layout">
    {{ 'b' }}
  </div>
</template>`,
  );
});

test("vue/script: if telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  if (import.meta.BATI_MODULES.includes("telefunc")) {
    console.log("telefunc");
  }
</script>`,
    "test.vue",
    {
      BATI_MODULES: ["telefunc"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  console.log("telefunc");
</script>`,
  );
});

test("vue/script: if not telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  if (import.meta.BATI_MODULES.includes("telefunc")) {
    console.log("telefunc");
  }
</script>`,
    "test.vue",
    {
      BATI_MODULES: [],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  
</script>`,
  );
});

test("vue/script-comment: if telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  //# import.meta.BATI_MODULES.includes("telefunc")
  console.log("telefunc");
</script>`,
    "test.vue",
    {
      BATI_MODULES: ["telefunc"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  
  console.log("telefunc");
</script>`,
  );
});

test("vue/script-comment: if not telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  //# import.meta.BATI_MODULES.includes("telefunc")
  console.log("telefunc");
</script>`,
    "test.vue",
    {
      BATI_MODULES: [],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  
  
</script>`,
  );
});

test("vue/script-conditional: if telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  const x = import.meta.BATI_MODULES.includes("telefunc") ? 'a' : 'b';
</script>`,
    "test.vue",
    {
      BATI_MODULES: ["telefunc"],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  const x = 'a';
</script>`,
  );
});

test("vue/script-conditional: if not telefunc", async () => {
  const renderedOutput = transform(
    `
<script>
  const x = import.meta.BATI_MODULES.includes("telefunc") ? 'a' : 'b';
</script>`,
    "test.vue",
    {
      BATI_MODULES: [],
    },
  );

  assert.equal(
    renderedOutput,
    `
<script>
  const x = 'b';
</script>`,
  );
});
