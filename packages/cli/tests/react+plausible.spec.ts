import { describe, expect, test } from "vitest";
import { prepare } from "./utils";

describe.concurrent("react + plausible", () => {
  const { fetch } = prepare(["react", "plausible.io"]);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('src="https://plausible.io');
  });
});
