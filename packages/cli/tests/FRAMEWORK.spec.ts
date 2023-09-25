import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

describeMany(["solid", "react", "vue"], [], ({ fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('src="https://plausible.io');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    const text = await res.text();
    expect(text).toContain('{"is404":true}');
    expect(text).not.toContain('src="https://plausible.io');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    const text = await res.text();
    expect(text).toContain('{"is404":true}');
    expect(text).not.toContain('src="https://plausible.io');
  });
});
