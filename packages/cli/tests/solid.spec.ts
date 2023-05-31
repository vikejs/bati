import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("solid", () => {
  const { fetch } = prepare(["solid"]);

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
