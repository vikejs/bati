import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("react + express + telefunc", () => {
  const { fetch } = prepare(["react", "express", "telefunc"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("telefunc", async () => {
    const res = await fetch("/_telefunc", {
      method: "post",
    });
    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
