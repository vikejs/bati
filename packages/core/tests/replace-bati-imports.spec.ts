import { describe, expect, test } from "vitest";
import { relative } from "../src/relative.js";

describe.each([
  { a: "pages/todo-trpc/+Page.tsx", b: "server/trpc/trpc", expected: "../../server/trpc/trpc" },
  { a: "pages\\todo-trpc\\+Page.tsx", b: "server/trpc/trpc", expected: "../../server/trpc/trpc" },
  { a: "pages/todo-trpc/+Page.tsx", b: "express-entry", expected: "../../express-entry" },
  { a: "pages\\todo-trpc\\+Page.tsx", b: "express-entry", expected: "../../express-entry" },
  { a: "+Page.tsx", b: "server/trpc/trpc", expected: "./server/trpc/trpc" },
  { a: "+Page.tsx", b: "express-entry", expected: "./express-entry" },
  { a: "pages/trpc/+Page.tsx", b: "pages/trpc/trpc", expected: "./trpc" },
  { a: "pages\\trpc\\+Page.tsx", b: "pages/trpc/trpc", expected: "./trpc" },
  { a: "pages/trpc/+Page.tsx", b: "pages/another-page/page", expected: "../another-page/page" },
])("rewrite $a: $b", ({ a, b, expected }: Record<"a" | "b" | "expected", string>) => {
  test(`returns ${expected}`, () => {
    expect(relative(a, b)).toBe(expected);
  });
});
