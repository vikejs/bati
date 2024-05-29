import { describeBati, execa, npmCli } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["express", "h3", "hono", "fastify"], "drizzle", "eslint"];

await describeBati(({ test, expect, fetch, beforeAll }) => {
  beforeAll(async () => {
    await execa(npmCli, ["run", "drizzle:generate"]);
    await execa(npmCli, ["run", "drizzle:migrate"]);
    await execa(npmCli, ["run", "drizzle:seed"]);
  }, 70000);

  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("todo", async () => {
    const res = await fetch("/todo");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("/api/todo/create", async () => {
    const res = await fetch("/api/todo/create", {
      method: "POST",
      body: JSON.stringify({ text: "test" }),
      headers: {
        "content-type": "application/json",
      },
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      message: "New Todo Created",
      result: { changes: 1, lastInsertRowid: 3 },
    });
  });
});
