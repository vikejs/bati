import type { EnvRegistry } from "@batijs/core";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { wranglerEnv } from "./env";

const registry: EnvRegistry = [
  { key: "AUTH0_CLIENT_ID", scope: "secret", devValueFrom: "TEST_AUTH0_CLIENT_ID", group: "auth0" },
  { key: "SENTRY_DSN", scope: "secret", devValueFrom: "TEST_SENTRY_DSN", group: "sentry" },
  { key: "API_BASE", scope: "server-default", default: "https://api.example.com" },
  { key: "PUBLIC_ENV__SENTRY_DSN", scope: "public", default: "" },
];

// May be set in the ambient environment (e.g. .env.test); isolate each test so
// the "empty secret" assertions are deterministic.
const TEST_VARS = ["TEST_AUTH0_CLIENT_ID", "TEST_SENTRY_DSN"] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const k of TEST_VARS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const k of TEST_VARS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("wranglerEnv", () => {
  test("emits server-runtime vars with empty secrets, skips public", () => {
    expect(wranglerEnv(registry)).toEqual({
      AUTH0_CLIENT_ID: "",
      SENTRY_DSN: "",
      API_BASE: "https://api.example.com",
    });
  });

  test("injects a secret's dev/test value when its source env var is set", () => {
    process.env.TEST_SENTRY_DSN = "https://dsn";
    expect(wranglerEnv(registry).SENTRY_DSN).toBe("https://dsn");
  });
});
