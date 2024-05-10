import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], ["express", "h3", "hono", "fastify", undefined], "trpc", "eslint"];

await describeBati(({ test, expect, fetch }) => {
  test("home", async () => {
    const res = await fetch("/");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("todo", async () => {
    const res = await fetch("/todo-trpc");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("/api/trpc/demo", async () => {
    const res = await fetch("/api/trpc/demo");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ result: { data: { demo: true } } });
  });

  test("/api/trpc/onNewTodo", async () => {
    const res = await fetch("/api/trpc/onNewTodo", {
      method: "POST",
      body: JSON.stringify("test"),
      headers: {
        "content-type": "application/json",
      },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      result: { data: { todoItems: [{ text: "Buy milk" }, { text: "Buy strawberries" }, { text: "test" }] } },
    });
  });
});
