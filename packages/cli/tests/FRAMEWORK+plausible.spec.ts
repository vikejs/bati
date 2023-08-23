import { expect, test } from "vitest";
import { describeMany } from "./utils";

describeMany(["solid", "react", "vue"], ["plausible.io"], ({ fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('src="https://plausible.io');
  });
});
