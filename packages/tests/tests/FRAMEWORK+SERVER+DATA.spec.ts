import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati, exec, npmCli, suite } from "@batijs/tests-utils";

const tests = suite()
  // SQLite engine: raw better-sqlite3 client plus Drizzle/Kysely on SQLite
  .matrix({
    framework: "solid",
    server: ["express", "elysia", "hono", "fastify"],
    data: ["trpc", "telefunc", "ts-rest", null],
    db: "sqlite",
    orm: ["drizzle", "kysely", null],
  })
  // No database
  .matrix({
    framework: "solid",
    server: ["express", "hono", "fastify", "elysia"],
    data: ["trpc", "telefunc", "ts-rest", null],
  })
  .matrix({
    framework: ["react", "vue"],
    server: "hono",
    data: ["trpc", "telefunc", "ts-rest", null],
  })
  // PostgreSQL engine: raw postgres.js client plus Drizzle/Kysely on Postgres.
  // Needs a PostgreSQL server at the default DATABASE_URL (provided by CI).
  .matrix({
    framework: "solid",
    server: ["express", "hono"],
    data: ["telefunc", null],
    db: "postgres",
    orm: ["drizzle", "kysely", null],
  })
  // Cloudflare D1 (the SQLite engine on Workers)
  .matrix({
    framework: "solid",
    server: "hono",
    deploy: "cloudflare",
    data: ["trpc", "telefunc", "ts-rest", null],
    db: "sqlite",
    orm: ["drizzle", "kysely", null],
  })
  // Docker (dokploy): exercise both engines' compose services
  .matrix({
    framework: "react",
    server: "hono",
    deploy: "dokploy",
    data: "telefunc",
    db: ["sqlite", "postgres"],
    orm: ["drizzle", null],
  })
  // Run the built Elysia server under BOTH runtimes via Docker: sqlite forces the
  // Node runtime (better-sqlite3 has no Bun prebuild → node:alpine image), while
  // postgres keeps the Bun image (oven/bun:alpine). The prod suites above only ever
  // run the built server under Node, so this is the only Bun coverage for it.
  .matrix({
    framework: "react",
    server: "elysia",
    deploy: "dokploy",
    data: "telefunc",
    db: ["sqlite", "postgres"],
    orm: "drizzle",
  })
  .linters("eslint", "biome", "oxlint");

export default tests;

// FlagMatrix-shaped alias so testMatch<TestFlags>() keeps autocompleting
// keys like "trpc", "telefunc", "drizzle", "dokploy", etc.
type TestFlags = readonly [(typeof tests)["__flagsType"]];

await describeMultipleBati([
  () =>
    describeBati(({ test, describe, expect, fetch, testMatch, context, beforeAll }) => {
      beforeAll(async () => {
        // Match on the tool first: drizzle/kysely + sqlite both set the `sqlite` flag,
        // so the raw-sqlite branch must come after the ORM branches.
        if (context.flags.includes("drizzle")) {
          await exec(npmCli, ["run", "drizzle:generate"]);
          await exec(npmCli, ["run", "drizzle:migrate"]);
        } else if (context.flags.includes("kysely")) {
          if (context.flags.includes("cloudflare")) {
            await exec(npmCli, ["run", "d1:migrate"]);
          } else {
            await exec(npmCli, ["run", "kysely:migrate"]);
          }
        } else if (context.flags.includes("sqlite")) {
          if (context.flags.includes("cloudflare")) {
            await exec(npmCli, ["run", "d1:migrate"]);
          } else {
            await exec(npmCli, ["run", "sqlite:migrate"]);
          }
        } else if (context.flags.includes("postgres")) {
          await exec(npmCli, ["run", "postgres:migrate"]);
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

        testMatch<TestFlags>("post", {
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

        testMatch<TestFlags>("todo after post", {
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
          postgres: async () => {
            const res = await fetch("/todo");
            expect(res.status).toBe(200);
            expect(await res.text()).toContain(text);
          },
        });

        testMatch<TestFlags>("TODO.md presence", {
          sqlite: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          drizzle: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          kysely: async () => {
            expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
          },
          postgres: async () => {
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

        testMatch<TestFlags>("has Dockerfile", {
          dokploy: async () => {
            expect(existsSync(path.join(process.cwd(), "Dockerfile"))).toBe(true);
          },
        });

        testMatch<TestFlags>("has docker-compose.yml", {
          dokploy: async () => {
            const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
            expect(content).toContain("Dockerfile");
            expect(content).toContain("3000");
          },
        });

        testMatch<TestFlags>("docker-compose.yml has DATABASE_URL when db selected", {
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
