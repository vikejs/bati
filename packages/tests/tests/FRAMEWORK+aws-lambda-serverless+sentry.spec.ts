import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as process from "process";
import { describeBati } from "@batijs/tests-utils";

export const matrix = ["aws-lambda-serverless", "react", ["hono", "hattip"], "eslint", ["sentry", undefined]] as const;

await describeBati(
  ({ test, testMatch, expect }) => {
    const serverless_entryfile = path.join(process.cwd(), "entry_aws_lambda.ts");

    const env_file = path.join(process.cwd(), ".env");
    const serverless_env_file = path.join(process.cwd(), "serverless-resources", "environment.json");
    const serverless_env_keys = ["SENTRY_DSN", "SENTRY_ENVIRONMENT", "SENTRY_PROFILER_BINARY_PATH"];
    const env_keys = ["SENTRY_ORG", "SENTRY_PROJECT", "SENTRY_AUTH_TOKEN", "SENTRY_DSN", "SENTRY_PROFILER_BINARY_PATH"];

    test("serverless files are present", async () => {
      expect(existsSync(path.join(process.cwd(), "serverless.yml"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "entry_aws_lambda.ts"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "serverless-resources"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "serverless-resources", "environment.json"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "serverless-resources", "esbuild"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "serverless-resources", "esbuild", "esbuild.config.cjs"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "serverless-resources", "esbuild", "esbuild-plugins.cjs"))).toBe(true);
    });

    testMatch<typeof matrix>("entry_aws_lambda.mjs / server", {
      hono: {
        sentry: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import * as Sentry from "@sentry/aws-serverless"`);
          expect(content).toContain(`import "./sentry-server.config";`);
        },
        _: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import { Hono } from "hono"`);
        },
      },
      hattip: {
        sentry: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import awsLambdaAdapter from "@hattip/adapter-aws-lambda"`);
        },
        _: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import awsLambdaAdapter from "@hattip/adapter-aws-lambda"`);
        },
      },
      _: {
        sentry: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import * as Sentry from "@sentry/aws-serverless"`);
          expect(content).toContain(`Sentry.wrapHandler`);
        },
        _: async () => {
          const content = await readFile(serverless_entryfile, "utf-8");
          expect(content).toContain(`import { renderPage } from "vike/server"`);
        },
      },
    });

    testMatch<typeof matrix>("<hono|hattip>-entry.ts", {
      sentry: {
        hono: async () => {
          const content = await readFile(path.join(process.cwd(), "hono-entry.ts"), "utf-8");
          expect(content).toContain(`import * as Sentry from "@sentry/aws-serverless"`);
          expect(content).toContain(`Sentry.captureException`);
        },
        hattip: async () => {
          const content = await readFile(path.join(process.cwd(), "hattip-entry.ts"), "utf-8");
          expect(content).toContain(`import * as SentryAWS from "@sentry/aws-serverless"`);
          expect(content).toContain(`SentryAWS.captureException`);
        },
      },
    });

    testMatch<typeof matrix>("esbuild-sentry-plugin.cjs", {
      sentry: async () => {
        expect(
          existsSync(path.join(process.cwd(), "serverless-resources", "esbuild", "esbuild-sentry-plugin.cjs")),
        ).toBe(true);
      },
    });

    testMatch<typeof matrix>("serverless-resources/environment.json", {
      sentry: async () => {
        {
          const content = await readFile(serverless_env_file, "utf-8");
          const environmentKeys = Object.keys(JSON.parse(content));
          expect(environmentKeys).toEqual(expect.arrayContaining(serverless_env_keys));
        }
      },
    });

    testMatch<typeof matrix>(".env", {
      sentry: async () => {
        {
          const content = await readFile(env_file, "utf-8");
          const envVariablesNames = content.split("\n").reduce(
            (acc, line) => {
              if (line.trim().startsWith("#")) return acc;
              const [key, _value] = line.split("=");
              if (_value === undefined) return acc;
              acc.push(key.trim());
              return acc;
            },
            <string[]>[],
          );
          expect(envVariablesNames).toEqual(expect.arrayContaining(env_keys));
        }
      },
    });

    testMatch<typeof matrix>("entry_aws_lambda.mjs / sentry", {
      hono: async () => {
        const content = await readFile(serverless_entryfile, "utf-8");
        expect(content).toContain(`import { Hono } from "hono"`);
      },
      hattip: async () => {
        const content = await readFile(serverless_entryfile, "utf-8");
        expect(content).toContain(`import awsLambdaAdapter from "@hattip/adapter-aws-lambda"`);
      },
      _: async () => {
        const content = await readFile(serverless_entryfile, "utf-8");
        expect(content).toContain(`import { renderPage } from "vike/server"`);
      },
    });
  },
  {
    mode: "build",
  },
);
