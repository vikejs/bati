import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

describeMany(["solid", "react", "vue"], ["hattip"], ({ fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    expect(await res.text()).toContain('{"is404":true}');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(await res.text()).toContain('{"is404":true}');
  });
});

// TODO: test build script
// `node dist/server/index.mjs` to run built server
