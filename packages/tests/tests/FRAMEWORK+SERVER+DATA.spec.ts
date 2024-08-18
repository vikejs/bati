import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  ["trpc", "telefunc", "ts-rest", undefined],
  ["drizzle", undefined],
  "eslint",
] as const;

export const exclude = [
  // Testing drizzle with Solid only is enough
  ["react", "drizzle"],
  ["vue", "drizzle"],
];

await describeBati(({ test, expect, fetch, testMatch, context, beforeAll }) => {
  beforeAll(async () => {
    if (context.flags.includes("drizzle")) {
      await exec(npmCli, ["run", "drizzle:generate"]);
      await exec(npmCli, ["run", "drizzle:migrate"]);
      await exec(npmCli, ["run", "drizzle:seed"]);
    }
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

  testMatch<typeof matrix>("onNewTodo", {
    telefunc: async () => {
      const res = await fetch("/_telefunc", {
        method: "POST",
        body: JSON.stringify({
          file: "/pages/todo/TodoList.telefunc.ts",
          name: "onNewTodo",
          args: [{ text: "test" }],
        }),
      });
      expect(res.status).toBe(200);
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
    },
    _: async () => {
      const res = await fetch("/api/todo/create", {
        method: "POST",
        body: JSON.stringify({ text: "test" }),
        headers: {
          "content-type": "application/json",
        },
      });
      expect(res.status).toBe(200);
    },
  });
});
