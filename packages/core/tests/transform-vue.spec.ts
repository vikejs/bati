import { assert, describe, test } from "vitest";
import { formatCode } from "../src/format.js";
import { transformAndFormat } from "../src/index.js";
import { transform } from "../src/parse/linters/index.js";

function testIfElse(code: string, expectedIf: string, expectedElse: string) {
  const filename = "test.vue";

  test("if", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new Set(["vue"]),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedIf);
  });

  test("else", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new Set(),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedElse);
  });
}

describe("vue/template: comment", () => {
  testIfElse(
    `<template>
  <!-- BATI.has("vue") -->
  <!-- This is a comment about the below component -->
  <!-- This is another comment about the below component -->
  <Link href="/todo">Todo</Link>
</template>`,
    `<template>
  <!-- This is a comment about the below component -->
  <!-- This is another comment about the below component -->
  <Link href="/todo">Todo</Link>
</template>`,
    `<template></template>`,
  );
});

describe("vue/template: conditional", () => {
  testIfElse(
    `<template>
  <div class="layout">
    {{ BATI.has("vue") ? "a" : "b" }}
  </div>
</template>`,
    `<template>
  <div class="layout">
    {{ "a" }}
  </div>
</template>`,
    `<template>
  <div class="layout">
    {{ "b" }}
  </div>
</template>`,
  );
});

describe("vue/script: if block", () => {
  testIfElse(
    `<script>
  if (BATI.has("vue")) {
    console.log("vue");
  }
</script>`,
    `<script>
  console.log("vue");
</script>`,
    `<script></script>`,
  );
});

describe("vue/script: if-else block", () => {
  testIfElse(
    `<script>
  if (BATI.has("vue")) {
    console.log("vue");
  } else {
    console.log("solid");
  }
</script>`,
    `<script>
  console.log("vue");
</script>`,
    `<script>
  console.log("solid");
</script>`,
  );
});

describe("vue/script: if-else statement", () => {
  testIfElse(
    `<script>
  if (BATI.has("vue"))
    console.log("vue");
  else
    console.log("solid");
</script>`,
    `<script>
  console.log("vue");
</script>`,
    `<script>
  console.log("solid");
</script>`,
  );
});

describe("vue/script: conditional", () => {
  testIfElse(
    `<script>
  const x = BATI.has("vue") ? "a" : "b";
</script>`,
    `<script>
  const x = "a";
</script>`,
    `<script>
  const x = "b";
</script>`,
  );
});

describe("vue/script: comment", () => {
  testIfElse(
    `<script>
  //# BATI.has("vue")
  console.log("vue");
</script>`,
    `<script>
  console.log("vue");
</script>`,
    `<script></script>`,
  );
});

describe('vue/script: rewrite "bati:" imports', async () => {
  test("test", async () => {
    const renderedOutput = await transformAndFormat(
      `<script>
  import { router } from "bati:./router";
  export const appRouter = router();
</script>`,
      {
        BATI: new Set(["vue"]),
      },
      { filepath: "test.vue" },
    );

    assert.equal(
      renderedOutput.code.trim(),
      `<script>
  import { router } from "./router";
  export const appRouter = router();
</script>`,
    );
  });
});

describe('vue/script: rewrite "@batijs/" imports', async () => {
  test("test", async () => {
    const renderedOutput = await transformAndFormat(
      `<script>
  import { router } from "@batijs/trpc/router";
  export const appRouter = router();
</script>`,
      {
        BATI: new Set(["vue"]),
      },
      { filepath: "test.vue" },
    );

    assert.equal(
      renderedOutput.code.trim(),
      `<script>
  import { router } from "./router";
  export const appRouter = router();
</script>`,
    );
  });
});

describe("vue/style: squirelly", () => {
  testIfElse(
    `<style>
/*{ @if (it.BATI.has("vue")) }*/
  @import "./vue.css";
/*{ #else }*/
  @import "./base.css";
/*{ /if }*/
</style>`,
    `<style>
  @import "./vue.css";
</style>`,
    `<style>
  @import "./base.css";
</style>`,
  );
});

test("vue formatter", async () => {
  const code = `<template>
  <div class="example">{{ msg }}</div>
</template>

<script>
  export default {
    data() {
      return {
        msg: "Hello world!",
      };
    },
  };
</script>

<style>
  .example {
    color: red;
  }
</style>

<custom1>
  This could be e.g. documentation for the component.
</custom1>
`;

  const renderedOutput = transform(code, "test.vue", {
    BATI: new Set(["vue"]),
  });

  assert.equal(await formatCode(renderedOutput.code, { filepath: "test.vue" }), code);
});
