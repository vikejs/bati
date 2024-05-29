import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify"],
  ["trpc", "telefunc"],
  "drizzle",
  "eslint",
];

await describeBati(({ test, expect, fetch, testMatch, beforeAll }) => {
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

  testMatch<typeof matrix>("onCreateTodo", {
    telefunc: async () => {
      const res = await fetch("/_telefunc", {
        method: "POST",
        body: JSON.stringify({
          file: "/components/TodoList.telefunc.ts",
          name: "onCreateTodo",
          args: [{ text: "test" }],
        }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ret: { result: { changes: 1, lastInsertRowid: 3 } } });
    },
    trpc: async () => {
      const res = await fetch("/api/trpc/onCreateTodo", {
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
            result: {
              changes: 1,
              lastInsertRowid: 3,
            },
          },
        },
      });
    },
  });
});
