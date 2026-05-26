import { BatiSet, features } from "@batijs/features";
import { afterEach, assert, describe, expect, test } from "vitest";
import {
  composeEnvEntries,
  type EnvRegistry,
  renderDotenv,
  serverEnvDefaults,
  type VikeMeta,
} from "../src/index.js";

function meta(...flags: string[]): VikeMeta {
  return { BATI: new BatiSet(flags as never[], features, "pnpm") };
}

// Mirrors the declarations spread across the auth0 / sentry / sqlite configs.
const notCloudflareDotenv = ({ meta, sink }: { meta: VikeMeta; sink: string }) =>
  !(sink === "dotenv" && meta.BATI.has("cloudflare"));

const registry: EnvRegistry = [
  {
    key: "DATABASE_URL",
    scope: "server-default",
    comment: "Path to the sqlite database",
    default: "sqlite.db",
    perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
    group: "non-D1 database",
    when: ({ meta }) => !meta.BATI.hasD1,
  },
  { key: "AUTH0_CLIENT_ID", scope: "secret", comment: "Auth0 Client ID", devValueFrom: "TEST_AUTH0_CLIENT_ID", group: "auth0", when: notCloudflareDotenv },
  { key: "SENTRY_DSN", scope: "secret", comment: "Sentry server DSN", devValueFrom: "TEST_SENTRY_DSN", group: "sentry" },
  { key: "PUBLIC_ENV__SENTRY_DSN", scope: "public", comment: "Sentry browser DSN", default: "" },
];

afterEach(() => {
  delete process.env.TEST_AUTH0_CLIENT_ID;
  delete process.env.TEST_SENTRY_DSN;
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
    assert.match(renderDotenv(registry, meta())!, /# Path to the sqlite database\nDATABASE_URL=/);
  });

  test("excludes a var from .env when its `when` rejects the dotenv sink", () => {
    // cloudflare → auth0 secret managed by wrangler, not .env
    assert.notMatch(renderDotenv(registry, meta("cloudflare"))!, /AUTH0_CLIENT_ID/);
  });

  test("drops the DATABASE_URL under D1", () => {
    assert.notMatch(renderDotenv(registry, meta("cloudflare", "sqlite"))!, /DATABASE_URL/);
  });

  test("returns undefined when nothing applies (no empty file)", () => {
    expect(renderDotenv([], meta())).toBeUndefined();
    expect(renderDotenv(undefined, meta())).toBeUndefined();
  });
});

describe("composeEnvEntries", () => {
  test("secrets pull from host, defaulted vars are host-overridable, public is omitted", () => {
    expect(composeEnvEntries(registry, meta("sqlite"))).toEqual([
      "DATABASE_URL=${DATABASE_URL:-/app/data/db.sqlite}",
      "AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}",
      "SENTRY_DSN=${SENTRY_DSN}",
    ]);
  });

  test("`when` is sink-aware: cloudflare excludes .env but not compose", () => {
    // auth0's dotenv-only exclusion must NOT drop it from compose
    expect(composeEnvEntries(registry, meta("cloudflare"))).toContain("AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}");
  });
});

describe("serverEnvDefaults", () => {
  test("groups by feature, defaults secrets empty, skips public", () => {
    expect(serverEnvDefaults(registry, meta("sqlite"))).toEqual([
      { comment: "non-D1 database", vars: { DATABASE_URL: "/app/database/sqlite.db" } },
      { comment: "auth0", vars: { AUTH0_CLIENT_ID: "" } },
      { comment: "sentry", vars: { SENTRY_DSN: "" } },
    ]);
  });
});
