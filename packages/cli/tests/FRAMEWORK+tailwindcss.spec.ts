import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

describeMany(["solid", "react", "vue"], ["tailwindcss"], ({ fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
