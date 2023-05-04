import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("basic", () => {
  const { fetch } = prepare(["solid", "express"]);

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
