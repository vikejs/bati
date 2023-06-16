import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("react + tailwindcss", () => {
  const { fetch } = prepare(["react", "tailwindcss"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
