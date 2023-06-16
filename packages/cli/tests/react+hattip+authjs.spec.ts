import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("react + hattip + authjs", () => {
  const { fetch } = prepare(["react", "hattip", "authjs"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("auth/signin", async () => {
    const res = await fetch("/api/auth/signin");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
