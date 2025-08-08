import { expect, test } from "vitest";
import { commentMarker, createMarkdownComment } from "../../src/markdown/utils.js";

test.each([
  [
    `<!--foo-->`,
    {
      name: "foo",
      suffix: "",
      attributes: "foo",
      parameters: { foo: "foo" },
      node: { type: "html", value: "<!--foo-->" },
    },
  ],
  [
    `<!--foo:end-->`,
    {
      name: "foo",
      suffix: "end",
      attributes: "foo:end",
      parameters: { "foo:end": "foo:end" },
      node: { type: "html", value: "<!--foo:end-->" },
    },
  ],
  [
    `<!--foo:start cond="BATI.has('aws')"-->`,
    {
      name: "foo",
      suffix: "start",
      attributes: "foo:start cond=\"BATI.has('aws')\"",
      parameters: { "foo:start": "foo:start", cond: "BATI.has('aws')" },
      node: { type: "html", value: "<!--foo:start cond=\"BATI.has('aws')\"-->" },
    },
  ],
])("%s => {object}", (value, expected) => {
  const params = commentMarker({ value, type: "html" });
  expect(params).toEqual(expected);
});

test.each([
  [{ category: "Error tracking", flag: "sentry" }, 'bati:start category="Error tracking" flag="sentry"'],
  [{ name: "notbati", category: "Error tracking" }, 'notbati:start category="Error tracking"'],
  [{ number: 123, bool: true, obj: [{ p: "p" }] }, 'bati:start number=123 bool=true obj=[{"p":"p"}]'],
])("createMarkdownComment (%s)", (options, expected) => {
  const wrapper = createMarkdownComment("start", options);
  expect(wrapper?.type).toBe("html");
  expect(wrapper?.value).toBe(`<!--${expected}-->`);
});
