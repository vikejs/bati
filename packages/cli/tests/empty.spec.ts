import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("empty", () => {
  const { fetch } = prepare([""]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
  });
});
