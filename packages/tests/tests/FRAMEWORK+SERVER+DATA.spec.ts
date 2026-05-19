import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify"],
  ["trpc", "telefunc", "ts-rest", undefined],
  ["drizzle", "sqlite", "kysely", undefined],
  ["cloudflare", undefined],
  ["dokploy", undefined],
  "eslint",
  "biome",
  "oxlint",
] as const;

export const exclude = [
  // Testing databases with Solid only is enough
  ["react", "drizzle"],
  ["vue", "drizzle"],
  ["react", "sqlite"],
  ["vue", "sqlite"],
  ["react", "kysely"],
  ["vue", "kysely"],
  // Testing Solid with all servers, but others UIs with only Hono
  ["react", "express"],
  ["react", "h3"],
  ["react", "fastify"],
  ["vue", "express"],
  ["vue", "h3"],
  ["vue", "fastify"],
  // Testing Cloudflare with [Hono, h3] and Solid only
  ["cloudflare", "express"],
  ["cloudflare", "fastify"],
  ["cloudflare", "react"],
  ["cloudflare", "vue"],
  // cloudflare and dokploy are mutually exclusive
  ["cloudflare", "dokploy"],
  // Restrict dokploy tests: only react + hono, once per data-fetch layer and once per db
  ["solid", "dokploy"],
  ["vue", "dokploy"],
  ["express", "dokploy"],
  ["h3", "dokploy"],
  ["fastify", "dokploy"],
  ["trpc", "dokploy"],
  ["ts-rest", "dokploy"],
  ["sqlite", "dokploy"],
  ["kysely", "dokploy"],
];

await describeMultipleBati([
  () =>
    describeBati(({ test, describe, expect, fetch, testMatch, context, beforeAll }) => {
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
        } else if (context.flags.includes("kysely")) {
          if (context.flags.includes("cloudflare")) {
            await exec(npmCli, ["run", "d1:migrate"]);
          } else {
            await exec(npmCli, ["run", "kysely:migrate"]);
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
          kysely: async () => {
            const res = await fetch("/todo");
            expect(res.status).toBe(200);
            expect(await res.text()).toContain(text);
          },
        });

        testMatch<typeof matrix>("TODO.md presence", {
          sqlite: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          drizzle: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          kysely: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          cloudflare: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          dokploy: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          _: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(false);
          },
        });

        testMatch<typeof matrix>("has Dockerfile", {
          dokploy: async () => {
            expect(existsSync(path.join(process.cwd(), "Dockerfile"))).toBe(true);
          },
        });

        testMatch<typeof matrix>("has docker-compose.yml", {
          dokploy: async () => {
            const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
            expect(content).toContain("Dockerfile");
            expect(content).toContain("3000");
          },
        });

        testMatch<typeof matrix>("docker-compose.yml has DATABASE_URL when db selected", {
          dokploy: {
            drizzle: async () => {
              const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
              expect(content).toContain("DATABASE_URL");
            },
          },
        });
      });
    }),
  // preview / docker-compose
  () =>
    describeBati(
      ({ test, expect, fetch }) => {
        test("home", async () => {
          const res = await fetch("/");
          expect(res.status).toBe(200);
          expect(await res.text()).not.toContain('{"is404":true}');
        });
      },
      {
        mode: (ctx) => (ctx.flags.includes("dokploy") ? "docker" : "prod"),
      },
    ),
]);
