import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  ["trpc", "telefunc", undefined],
  "drizzle",
  "eslint",
];

await describeBati(({ test, expect, fetch, testMatch, context, beforeAll }) => {
  beforeAll(async () => {
    await exec(npmCli, ["run", "drizzle:generate"]);
    await exec(npmCli, ["run", "drizzle:migrate"]);
    await exec(npmCli, ["run", "drizzle:seed"]);
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

  if (!context.flags.includes("telefunc") && !context.flags.includes("trpc"))
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

  testMatch<typeof matrix>("onNewTodo", {
    telefunc: async () => {
      const res = await fetch("/_telefunc", {
        method: "POST",
        body: JSON.stringify({
          file: "/components/TodoList.telefunc.ts",
          name: "onNewTodo",
          args: [{ text: "test" }],
        }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ret: { changes: 1, lastInsertRowid: 3 } });
    },
    trpc: async () => {
      const res = await fetch("/api/trpc/onNewTodo", {
        method: "POST",
        body: JSON.stringify("test"),
        headers: {
          "content-type": "application/json",
        },
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        result: {
          data: {
            changes: 1,
            lastInsertRowid: 3,
          },
        },
      });
    },
  });
});
