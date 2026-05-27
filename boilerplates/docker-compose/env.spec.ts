import type { EnvRegistry, VikeMeta } from "@batijs/core";
import { BatiSet, features } from "@batijs/features";
import { describe, expect, test } from "vitest";
import { composeEnvEntries, serverEnvDefaults } from "./env";

function meta(...flags: string[]): VikeMeta {
  return { BATI: new BatiSet(flags as never[], features, "pnpm") };
}

const notCloudflareDotenv = ({ meta, sink }: { meta: VikeMeta; sink: string }) =>
  !(sink === "dotenv" && meta.BATI.has("cloudflare"));

const registry: EnvRegistry = [
  {
    key: "DATABASE_URL",
    scope: "server-default",
    default: "sqlite.db",
    perSink: { compose: "/app/data/db.sqlite", dockerfile: "/app/database/sqlite.db" },
    group: "non-D1 database",
    when: ({ meta }) => !meta.BATI.hasD1,
  },
  { key: "AUTH0_CLIENT_ID", scope: "secret", group: "auth0", when: notCloudflareDotenv },
  { key: "SENTRY_DSN", scope: "secret", group: "sentry" },
  { key: "PUBLIC_ENV__SENTRY_DSN", scope: "public", default: "" },
];

describe("composeEnvEntries", () => {
  test("secrets pull from host, defaulted vars are host-overridable, public is omitted", () => {
    expect(composeEnvEntries(registry, meta("sqlite"))).toEqual([
      "DATABASE_URL=${DATABASE_URL:-/app/data/db.sqlite}",
      "AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}",
      "SENTRY_DSN=${SENTRY_DSN}",
    ]);
  });

  test("`when` is sink-aware: cloudflare excludes .env but not compose", () => {
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

  test("drops the database default under D1", () => {
    expect(serverEnvDefaults(registry, meta("cloudflare", "sqlite"))).toEqual([
      { comment: "auth0", vars: { AUTH0_CLIENT_ID: "" } },
      { comment: "sentry", vars: { SENTRY_DSN: "" } },
    ]);
  });
});
