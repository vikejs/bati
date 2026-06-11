import { BatiSet, features } from "@batijs/features";
import { assert, describe, test } from "vitest";
import { tidyWhitespace } from "../src/format.js";
import { transformAndFormat } from "../src/index.js";
import { transform } from "../src/parse.js";

function testIfElse(code: string, expectedIf: string, expectedElse: string) {
  const filename = "test.vue";

  test("if", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet(["vue"], features, "pnpm"),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedIf);
  });

  test("else", async () => {
    const renderedOutput = await transformAndFormat(
      code,
      {
        BATI: new BatiSet([], features, "pnpm"),
      },
      { filepath: filename },
    );

    assert.equal(renderedOutput.code.trim(), expectedElse);
  });
}

describe("vue/template: comment", () => {
  testIfElse(
    `<template>
  <!-- $$.BATI.has("vue") -->
  <!-- This is a comment about the below component -->
  <!-- This is another comment about the below component -->
  <Link href="/todo">Todo</Link>
</template>`,
    `<template>
  <!-- This is a comment about the below component -->
  <!-- This is another comment about the below component -->
  <Link href="/todo">Todo</Link>
</template>`,
    `<template>
</template>`,
  );
});

describe("vue/template: interpolation is a known gap (left untouched)", () => {
  // `{{ … }}` interpolations and v-if/binding expressions are raw text to the parser, so a `$$`
  // condition inside them is NOT evaluated — boilerplate must gate the element via `<!-- $$… -->` or
  // move the conditional into <script>. This locks that pass-through behavior.
  test("passes the expression through unchanged", async () => {
    const code = `<template>
  <div class="layout">{{ $$.BATI.has("vue") ? "a" : "b" }}</div>
</template>`;
    const renderedOutput = await transformAndFormat(
      code,
      { BATI: new BatiSet(["vue"], features, "pnpm") },
      { filepath: "test.vue" },
    );

    assert.include(renderedOutput.code, `$$.BATI.has("vue") ? "a" : "b"`);
  });
});

describe("vue/script: if block", () => {
  testIfElse(
    `<script>
if ($$.BATI.has("vue")) {
  console.log("vue");
}
</script>`,
    `<script>
console.log("vue");
</script>`,
    `<script>
</script>`,
  );
});

describe("vue/script: if-else block", () => {
  testIfElse(
    `<script>
if ($$.BATI.has("vue")) {
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
if ($$.BATI.has("vue"))
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
const x = $$.BATI.has("vue") ? "a" : "b";
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
//# $$.BATI.has("vue")
console.log("vue");
</script>`,
    `<script>
console.log("vue");
</script>`,
    `<script>
</script>`,
  );
});

describe('vue/script: rewrite "@batijs/" imports', async () => {
  test("test", async () => {
    const renderedOutput = await transformAndFormat(
      `<script>
import { router } from "@batijs/trpc/router";
export const appRouter = router();
</script>`,
      {
        BATI: new BatiSet(["vue"], features, "pnpm"),
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

describe("vue/style: comment-delimited blocks", () => {
  testIfElse(
    `<style>
/* $$.if($$.BATI.has("vue")) */
@import "./vue.css";
/* $$.else */
@import "./base.css";
/* $$.endif */
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

  const renderedOutput = await transform(code, "test.vue", {
    BATI: new BatiSet(["vue"], features, "pnpm"),
  });

  assert.equal(tidyWhitespace(renderedOutput.code), code);
});
