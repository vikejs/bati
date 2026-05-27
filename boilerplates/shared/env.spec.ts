/** biome-ignore-all lint/style/noNonNullAssertion: ok */
import type { EnvRegistry, VikeMeta } from "@batijs/core";
import { BatiSet, features } from "@batijs/features";
import { afterEach, assert, beforeEach, describe, expect, test } from "vitest";
import { renderDotenv } from "./env";

function meta(...flags: string[]): VikeMeta {
  return { BATI: new BatiSet(flags as never[], features, "pnpm") };
}

const registry: EnvRegistry = [
  {
    key: "DATABASE_URL",
    scope: "server-default",
    comment: `Path to the database
Used by the ORM`,
    default: "sqlite.db",
  },
  { key: "AUTH0_CLIENT_ID", scope: "secret", comment: "Auth0 Client ID", devValueFrom: "TEST_AUTH0_CLIENT_ID" },
  { key: "SENTRY_DSN", scope: "secret", comment: "Sentry server DSN", devValueFrom: "TEST_SENTRY_DSN" },
  { key: "PUBLIC_ENV__SENTRY_DSN", scope: "public", comment: "Sentry browser DSN", default: "" },
];

// These may be set in the ambient environment (e.g. .env.test); isolate each
// test from them so the "empty secret" assertions are deterministic.
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

describe("renderDotenv", () => {
  test("quotes a defaulted value and leaves an empty secret blank", () => {
    const out = renderDotenv(registry, meta("sqlite"))!;
    expect(out).toContain(`DATABASE_URL="sqlite.db"`);
    expect(out).toContain(`AUTH0_CLIENT_ID=\n`);
    expect(out).toContain(`SENTRY_DSN=\n`);
    expect(out).toContain(`PUBLIC_ENV__SENTRY_DSN=\n`);
  });

  test("injects a secret's dev/test value when its source env var is set", () => {
    process.env.TEST_AUTH0_CLIENT_ID = "abc123";
    assert.match(renderDotenv(registry, meta("sqlite"))!, /AUTH0_CLIENT_ID="abc123"/);
  });

  test("multi-line comments are prefixed per line", () => {
    assert.match(renderDotenv(registry, meta())!, /# Path to the database\n# Used by the ORM\nDATABASE_URL=/);
  });

  test("under cloudflare, keeps public vars but drops server-runtime secrets/defaults", () => {
    const out = renderDotenv(registry, meta("cloudflare"))!;
    assert.match(out, /^PUBLIC_ENV__SENTRY_DSN=/m);
    assert.notMatch(out, /^AUTH0_CLIENT_ID=/m);
    assert.notMatch(out, /^SENTRY_DSN=/m);
    assert.notMatch(out, /^DATABASE_URL=/m);
  });

  test("returns undefined when nothing applies (no empty file)", () => {
    expect(renderDotenv([], meta())).toBeUndefined();
  });
});
