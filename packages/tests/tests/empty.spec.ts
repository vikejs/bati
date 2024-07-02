import { existsSync } from "node:fs";
import path from "node:path";
import { describeBati } from "@batijs/tests-utils";

export const matrix = [];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Created with Bâti");
  });

  test("Bati render files are present", async () => {
    expect(existsSync(path.join(process.cwd(), "renderer", "+onRenderHtml.ts"))).toBe(true);
  });

  test("Bati optional files are NOT present", async () => {
    expect(existsSync(path.join(process.cwd(), "server", "vike-handler.ts"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "server", "create-todo-handler.ts"))).toBe(false);
  });
});
