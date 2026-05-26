import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati, describeMultipleBati, exec, npmCli, suite } from "@batijs/tests-utils";

// Replaces the old `matrix` + 20 `exclude` rules with 4 explicit include sections.
// Each section reads as a positive declaration of what gets tested.
const tests = suite()
  // Section 1: full data×server×db sweep — on Solid only.
  // (Old excludes: react/vue × drizzle/sqlite/kysely)
  .matrix({
    framework: "solid",
    server: ["express", "h3", "hono", "fastify"],
    data: ["trpc", "telefunc", "ts-rest", null],
    db: ["drizzle", "sqlite", "kysely", null],
  })
  // Section 2: react & vue tested with Hono only, no db sweep.
  // (Old excludes: react/vue × express/h3/fastify)
  .matrix({
    framework: ["react", "vue"],
    server: "hono",
    data: ["trpc", "telefunc", "ts-rest", null],
  })
  // Section 3: Cloudflare — solid + hono/h3 only.
  // (Old excludes: cloudflare × {express,fastify,react,vue,dokploy})
  .matrix({
    framework: "solid",
    server: ["hono", "h3"],
    deploy: "cloudflare",
    data: ["trpc", "telefunc", "ts-rest", null],
    db: ["drizzle", "sqlite", "kysely", null],
  })
  // Section 4: Dokploy — react + hono only, narrow data×db (matches old
  // excludes that whitelisted only telefunc/_ and kysely/_).
  .matrix({
    framework: "react",
    server: "hono",
    deploy: "dokploy",
    data: "telefunc",
    db: ["kysely", "drizzle", "sqlite", null],
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
