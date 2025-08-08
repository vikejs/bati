import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify"],
  ["trpc", "telefunc", "ts-rest", undefined],
  ["drizzle", "sqlite", undefined],
  ["cloudflare", undefined],
  "eslint",
  "biome",
] as const;

export const exclude = [
  // Testing databases with Solid only is enough
  ["react", "drizzle"],
  ["vue", "drizzle"],
  ["react", "sqlite"],
  ["vue", "sqlite"],
  // Testing Solid with all servers, but others UIs with only Hono
  ["react", "express"],
  ["react", "h3"],
  ["react", "fastify"],
  ["vue", "express"],
  ["vue", "h3"],
  ["vue", "fastify"],
  // Testing Cloudflare with Hono and Solid only
  ["cloudflare", "express"],
  ["cloudflare", "h3"],
  ["cloudflare", "fastify"],
  ["cloudflare", "react"],
  ["cloudflare", "vue"],
];

await describeBati(({ test, describe, expect, fetch, testMatch, context, beforeAll }) => {
  beforeAll(async () => {
    if (context.flags.includes("drizzle")) {
      await exec(npmCli, ["run", "drizzle:generate"]);
      await exec(npmCli, ["run", "drizzle:migrate"]);
    } else if (context.flags.includes("sqlite")) {
      if (context.flags.includes("cloudflare")) {
        await exec(npmCli, ["run", "d1:migrate"]);
      } else {
        await exec(npmCli, ["run", "sqlite:migrate"]);
      }
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

  describe("add a todo", { sequential: true }, () => {
    const text = "__BATI_TEST_VALUE";

    testMatch<typeof matrix>("post", {
      telefunc: async () => {
        const res = await fetch("/_telefunc", {
          method: "POST",
          body: JSON.stringify({
            file: "/pages/todo/TodoList.telefunc.ts",
            name: "onNewTodo",
            args: [{ text }],
          }),
        });
        expect(res.status).toBe(200);
      },
      trpc: async () => {
        const res = await fetch("/api/trpc/onNewTodo", {
          method: "POST",
          body: JSON.stringify(text),
          headers: {
            "content-type": "application/json",
          },
        });
        expect(res.status).toBe(200);
      },
      _: async () => {
        const res = await fetch("/api/todo/create", {
          method: "POST",
          body: JSON.stringify({ text }),
          headers: {
            "content-type": "application/json",
          },
        });
        expect(res.status).toBe(200);
      },
    });

    testMatch<typeof matrix>("todo after post", {
      sqlite: async () => {
        const res = await fetch("/todo");
        expect(res.status).toBe(200);
        expect(await res.text()).toContain(text);
      },
      drizzle: async () => {
        const res = await fetch("/todo");
        expect(res.status).toBe(200);
        expect(await res.text()).toContain(text);
      },
    });
  });
});
