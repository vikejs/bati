import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describeBati } from "@batijs/tests-utils";

export const matrix = [
  "dokploy",
  "react",
  ["hono", "express", "fastify", "h3"],
  ["drizzle", "authjs", undefined],
  ["eslint", "biome", "oxlint"],
] as const;

await describeBati(
  ({ test, expect, testMatch }) => {
    test("has Dockerfile", () => {
      expect(existsSync(path.join(process.cwd(), "Dockerfile"))).toBe(true);
    });

    test("has docker-compose.yml", () => {
      expect(existsSync(path.join(process.cwd(), "docker-compose.yml"))).toBe(true);
    });

    test("has .dockerignore", () => {
      expect(existsSync(path.join(process.cwd(), ".dockerignore"))).toBe(true);
    });

    test("has TODO.md", () => {
      expect(existsSync(path.join(process.cwd(), "TODO.md"))).toBe(true);
    });

    test("docker-compose.yml references Dockerfile", () => {
      const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
      expect(content).toContain("Dockerfile");
    });

    test("docker-compose.yml exposes port 3000", () => {
      const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
      expect(content).toContain("3000");
    });

    test("TODO.md mentions Dokploy", () => {
      const content = readFileSync(path.join(process.cwd(), "TODO.md"), "utf8");
      expect(content.toLowerCase()).toContain("dokploy");
    });

    testMatch<typeof matrix>("docker-compose.yml has conditional content", {
      drizzle: async () => {
        const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
        expect(content).toContain("sqlite_data");
        expect(content).toContain("volumes:");
      },
      authjs: async () => {
        const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
        expect(content).toContain("AUTH_SECRET");
        expect(content).toContain("AUTH_URL");
      },
      _: async () => {
        const content = readFileSync(path.join(process.cwd(), "docker-compose.yml"), "utf8");
        expect(content).not.toContain("sqlite_data");
        expect(content).not.toContain("AUTH_SECRET");
      },
    });

    test("Dockerfile uses multi-stage build", () => {
      const content = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");
      expect(content).toContain("AS builder");
      expect(content).toContain("AS runner");
    });

    test("Dockerfile runs Node.js server", () => {
      const content = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");
      expect(content).toContain("dist/server/index.mjs");
    });
  },
  {
    mode: "none",
  },
);
