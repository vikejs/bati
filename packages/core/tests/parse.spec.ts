import { suite } from "uvu";
import * as assert from "uvu/assert";
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

const Suite = suite("transformAst");

Suite("includes:react", () => {
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

Suite("includes:solid", () => {
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

Suite("if-elseif-else:react", () => {
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

Suite("if-elseif-else:solid", () => {
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

Suite("if-elseif-else:other", () => {
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

Suite("external variable", () => {
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
    (err: unknown) => err instanceof ReferenceError
  );
});

Suite("ternary:react", () => {
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

Suite("ternary:solid", () => {
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

Suite("ternary:other", () => {
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

Suite("import cleanup:react", async () => {
  const code = await transformAndGenerate(
    ast(
      `import react from 'react';
    import { solid } from 'solid';
    
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

Suite("import cleanup:solid", async () => {
  const code = await transformAndGenerate(
    ast(
      `import react from 'react';
    import { solid } from 'solid';
    
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

Suite("import cleanup:other", async () => {
  const code = await transformAndGenerate(
    ast(
      `import react from 'react';
    import { solid } from 'solid';
    
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

Suite("remove VIKE_REMOVE", () => {
  const tree = transformAst(ast(`const a = [import.meta.VIKE_REMOVE, 'a']`), {
    VIKE_MODULES: ["framework:vue"],
  });

  assertEquivalentAst(tree, ast(`const a = ['a']`));
});

Suite.run();
