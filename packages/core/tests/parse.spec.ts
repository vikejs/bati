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
    `if (import.meta.VIKE_MODULES.includes("framework:react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_MODULES: ["framework:react"],
    }
  );

  assertEquivalentAst(
    tree,
    ast(
      `
      content = {
        ...content,
        jsx: "react"
      };
    `
    )
  );
});

test("includes:solid", () => {
  const tree = testAst(
    `if (import.meta.VIKE_MODULES.includes("framework:react")) {
    content = { ...content, jsx: "react" };
  }`,
    {
      VIKE_MODULES: ["framework:solid"],
    }
  );

  assertEquivalentAst(tree, ast(""));
});

test("if-elseif-else:react", () => {
  const tree = testAst(
    `if (import.meta.VIKE_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.VIKE_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      VIKE_MODULES: ["framework:react"],
    }
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "react" };`));
});

test("if-elseif-else:solid", () => {
  const tree = testAst(
    `if (import.meta.VIKE_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.VIKE_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      VIKE_MODULES: ["framework:solid"],
    }
  );

  assertEquivalentAst(tree, ast(`content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };`));
});

test("if-elseif-else:other", () => {
  const tree = testAst(
    `if (import.meta.VIKE_MODULES.includes("framework:react")) {
      content = { ...content, jsx: "react" };
    } else if (import.meta.VIKE_MODULES.includes("framework:solid")) {
      content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
    } else {
      console.log('NOTHING TO DO');
    }`,
    {
      VIKE_MODULES: ["framework:vue"],
    }
  );

  assertEquivalentAst(tree, ast(`console.log('NOTHING TO DO');`));
});

test("external variable", () => {
  assert.throws(
    () =>
      testAst(
        `if (import.meta.VIKE_MODULES.includes(someVar)) {
    content = { ...content, jsx: "react" };
  }`,
        {
          VIKE_MODULES: ["framework:react"],
        }
      ),
    ReferenceError
  );
});

test("ternary:react", () => {
  const tree = testAst(
    `import.meta.VIKE_MODULES.includes("framework:react")
    ? 1
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      VIKE_MODULES: ["framework:react"],
    }
  );

  assertEquivalentAst(tree, ast(`1`));
});

test("ternary:solid", () => {
  const tree = testAst(
    `import.meta.VIKE_MODULES.includes("framework:react")
    ? 1
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      VIKE_MODULES: ["framework:solid"],
    }
  );

  assertEquivalentAst(tree, ast(`2`));
});

test("ternary:other", () => {
  const tree = testAst(
    `import.meta.VIKE_MODULES.includes("framework:react")
    ? 1
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? 2
    : null`,
    {
      VIKE_MODULES: ["framework:vue"],
    }
  );

  assertEquivalentAst(tree, ast(`null`));
});

test("import cleanup:react", async () => {
  const code = transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    const framework = import.meta.VIKE_MODULES.includes("framework:react")
    ? react()
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `
    ),
    {
      VIKE_MODULES: ["framework:react"],
    }
  );

  assertEquivalentAst(
    ast(code),
    ast(
      `import react from 'react';
    const framework = react();`
    )
  );
});

test("import cleanup:solid", async () => {
  const code = transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    const framework = import.meta.VIKE_MODULES.includes("framework:react")
    ? react()
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `
    ),
    {
      VIKE_MODULES: ["framework:solid"],
    }
  );

  assertEquivalentAst(
    ast(code),
    ast(
      `import { solid } from 'solid';
    const framework = solid();`
    )
  );
});

test("import cleanup:other", async () => {
  const code = transformAndGenerate(
    ast(
      `
    import { solid } from 'solid';
    import react from 'react';
    
    const framework = import.meta.VIKE_MODULES.includes("framework:react")
    ? react()
    : import.meta.VIKE_MODULES.includes("framework:solid")
    ? solid()
    : null;
    `
    ),
    {
      VIKE_MODULES: ["framework:vue"],
    }
  );

  assertEquivalentAst(ast(code), ast(`const framework = null;`));
});

test("remove VIKE_REMOVE", () => {
  const tree = transformAst(ast(`const a = [import.meta.VIKE_REMOVE, 'a']`), {
    VIKE_MODULES: ["framework:vue"],
  });

  assertEquivalentAst(tree, ast(`const a = ['a']`));
});
