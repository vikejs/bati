import { expect, test } from "vitest";
import { describeMany } from "./utils";

describeMany(["solid", "react", "vue"], ["hattip", "authjs"], ({ fetch }) => {
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
