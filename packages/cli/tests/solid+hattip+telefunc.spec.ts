import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("solid + hattip + telefunc", () => {
  const { fetch } = prepare(["solid", "hattip", "telefunc"]);

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
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
