import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("solid + prisma", () => {
  const { fetch } = prepare(["solid", "prisma"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });
});
