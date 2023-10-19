import { assert, describe, test } from "vitest";
import { formatCode } from "../src/format.js";
import { transform } from "../src/parse/linters/index.js";

function testIfElse(code: string, expectedIf: string, expectedElse: string) {
  const filename = "test.vue";

  test("if", async () => {
    const renderedOutput = transform(code, filename, {
      BATI_MODULES: ["vue"],
    });

    assert.equal((await formatCode(renderedOutput, { filepath: filename })).trim(), expectedIf);
  });

  test("else", async () => {
    const renderedOutput = transform(code, filename, {
      BATI_MODULES: [],
    });

    assert.equal((await formatCode(renderedOutput, { filepath: filename })).trim(), expectedElse);
  });
}

describe("vue/template: comment", () => {
  testIfElse(
    `<template>
  <!-- import.meta.BATI_MODULES?.includes("vue") -->
  <Link href="/todo">Todo</Link>
</template>`,
    `<template>
  <Link href="/todo">Todo</Link>
</template>`,
    `<template></template>`,
  );
});

describe("vue/template: conditional", () => {
  testIfElse(
    `<template>
  <div class="layout">
    {{ import.meta.BATI_MODULES?.includes("vue") ? 'a' : 'b' }}
  </div>
</template>`,
    `<template>
  <div class="layout">
    {{ 'a' }}
  </div>
</template>`,
    `<template>
  <div class="layout">
    {{ 'b' }}
  </div>
</template>`,
  );
});

describe("vue/script: if block", () => {
  testIfElse(
    `<script>
  if (import.meta.BATI_MODULES.includes("vue")) {
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
  if (import.meta.BATI_MODULES.includes("vue")) {
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
  if (import.meta.BATI_MODULES.includes("vue"))
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
  const x = import.meta.BATI_MODULES.includes("vue") ? 'a' : 'b';
</script>`,
    `<script>
  const x = 'a';
</script>`,
    `<script>
  const x = 'b';
</script>`,
  );
});

describe("vue/script: comment", () => {
  testIfElse(
    `<script>
  //# import.meta.BATI_MODULES.includes("vue")
  console.log("vue");
</script>`,
    `<script>

  console.log("vue");
</script>`,
    `<script></script>`,
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
        msg: 'Hello world!'
      }
    }
  }
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
    BATI_MODULES: ["vue"],
  });

  assert.equal(await formatCode(renderedOutput, { filepath: "test.vue" }), code);
});
