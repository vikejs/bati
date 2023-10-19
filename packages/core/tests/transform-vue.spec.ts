import { assert, describe, test } from "vitest";
import { transform } from "../src/parse/linters/index.js";

function testIfElse(code: string, expectedIf: string, expectedElse: string) {
  test("if", async () => {
    const renderedOutput = transform(code, "test.vue", {
      BATI_MODULES: ["vue"],
    });

    assert.equal(renderedOutput, expectedIf);
  });

  test("else", async () => {
    const renderedOutput = transform(code, "test.vue", {
      BATI_MODULES: [],
    });

    assert.equal(renderedOutput, expectedElse);
  });
}

describe("vue/template: comment", () => {
  testIfElse(
    `
<template>
  <!-- import.meta.BATI_MODULES?.includes("vue") -->
  <Link href="/todo">Todo</Link>
</template>
`,
    `
<template>
  
  <Link href="/todo">Todo</Link>
</template>
`,
    `
<template>
  
  
</template>
`,
  );
});

describe("vue/template: conditional", () => {
  testIfElse(
    `
<template>
  <div class="layout">
    {{ import.meta.BATI_MODULES?.includes("vue") ? 'a' : 'b' }}
  </div>
</template>
`,
    `
<template>
  <div class="layout">
    {{ 'a' }}
  </div>
</template>
`,
    `
<template>
  <div class="layout">
    {{ 'b' }}
  </div>
</template>
`,
  );
});

describe("vue/script: if block", () => {
  testIfElse(
    `
<script>
  if (import.meta.BATI_MODULES.includes("vue")) {
    console.log("vue");
  }
</script>
`,
    `
<script>
  console.log("vue");
</script>
`,
    `
<script>
  
</script>
`,
  );
});

describe("vue/script: if-else block", () => {
  testIfElse(
    `
<script>
  if (import.meta.BATI_MODULES.includes("vue")) {
    console.log("vue");
  } else {
    console.log("solid");
  }
</script>
`,
    `
<script>
  console.log("vue");
</script>
`,
    `
<script>
  console.log("solid");
</script>
`,
  );
});

describe("vue/script: if-else statement", () => {
  testIfElse(
    `
<script>
  if (import.meta.BATI_MODULES.includes("vue"))
    console.log("vue");
  else
    console.log("solid");
</script>
`,
    `
<script>
  console.log("vue");
</script>
`,
    `
<script>
  console.log("solid");
</script>
`,
  );
});

describe("vue/script: conditional", () => {
  testIfElse(
    `
<script>
  const x = import.meta.BATI_MODULES.includes("vue") ? 'a' : 'b';
</script>
`,
    `
<script>
  const x = 'a';
</script>
`,
    `
<script>
  const x = 'b';
</script>
`,
  );
});

describe("vue/script: comment", () => {
  testIfElse(
    `
<script>
  //# import.meta.BATI_MODULES.includes("vue")
  console.log("vue");
</script>
`,
    `
<script>
  
  console.log("vue");
</script>
`,
    `
<script>
  
  
</script>
`,
  );
});
