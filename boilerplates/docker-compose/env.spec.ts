/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: valid */
import type { EnvRegistry } from "@batijs/core";
import { describe, expect, test } from "vitest";
import { composeEnvEntries, serverEnvDefaults } from "./env";

const registry: EnvRegistry = [
  {
    key: "DATABASE_URL",
    scope: "server-default",
    default: "sqlite.db",
    perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
    group: "non-D1 database",
  },
  { key: "AUTH0_CLIENT_ID", scope: "secret", group: "auth0" },
  { key: "SENTRY_DSN", scope: "secret", group: "sentry" },
  { key: "PUBLIC_ENV__SENTRY_DSN", scope: "public", default: "" },
];

describe("composeEnvEntries", () => {
  test("secrets pull from host, defaulted vars are pinned to their compose value, public is omitted", () => {
    expect(composeEnvEntries(registry)).toEqual([
      "DATABASE_URL=/app/data/db.sqlite",
      "AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}",
      "SENTRY_DSN=${SENTRY_DSN}",
    ]);
  });
});

describe("serverEnvDefaults", () => {
  test("groups by feature, defaults secrets empty, skips public", () => {
    expect(serverEnvDefaults(registry)).toEqual([
      { comment: "non-D1 database", vars: { DATABASE_URL: "/app/database/sqlite.db" } },
      { comment: "auth0", vars: { AUTH0_CLIENT_ID: "" } },
      { comment: "sentry", vars: { SENTRY_DSN: "" } },
    ]);
  });
});
