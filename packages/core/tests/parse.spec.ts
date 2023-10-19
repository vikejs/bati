import { parseModule } from "magicast";
import { test } from "vitest";
import { transformAst, transformAstAndGenerate } from "../src/parse.js";
import { assertEquivalentAst } from "../src/testUtils.js";
import type { VikeMeta } from "../src/types.js";

function ast(code: string) {
  return parseModule(code).$ast;
}

function testAst(code: string, meta: VikeMeta) {
  const tree = ast(code);

  return transformAst(tree, meta);
}

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
