import { assert, describe, test } from "vitest";
import { dockerfile, dockerPackageManager } from "../src/dockerfile.js";

describe("DockerfileBuilder", () => {
  // ── Comments ────────────────────────────────────────────────────────────────

  test("comment renders before its instruction", () => {
    const out = dockerfile().from("node:20", { comment: "use official image", as: "base" }).build();
    assert.equal(out, "# use official image\nFROM node:20 AS base");
  });

  test("multi-line comment splits into multiple # lines", () => {
    const out = dockerfile().workdir("/app", { comment: "line one\nline two" }).build();
    assert.equal(out, "# line one\n# line two\nWORKDIR /app");
  });

  test("no comment → no extra line", () => {
    assert.equal(dockerfile().from("node:20", { as: "app" }).build(), "FROM node:20 AS app");
  });

  // ── Instructions ──────────────────────────────────────────────────────────────

  test("FROM with stage alias", () => {
    assert.equal(dockerfile().from("oven/bun:1", { as: "base" }).build(), "FROM oven/bun:1 AS base");
  });

  test("WORKDIR", () => {
    assert.equal(dockerfile().workdir("/app").build(), "WORKDIR /app");
  });

  test("RUN", () => {
    assert.equal(dockerfile().run("corepack enable").build(), "RUN corepack enable");
  });

  test("COPY basic", () => {
    assert.equal(
      dockerfile().copy(["package.json", "bun.lock*"], "/app/").build(),
      "COPY package.json bun.lock* /app/",
    );
  });

  test("COPY --from a declared stage", () => {
    const out = dockerfile()
      .from("node:20", { as: "build" })
      .copy(["node_modules"], "node_modules", { from: "build" })
      .build();
    assert.match(out, /COPY --from=build node_modules node_modules/);
  });

  test("ENV single value", () => {
    assert.equal(dockerfile().env({ NODE_ENV: "production" }).build(), "ENV NODE_ENV=production");
  });

  test("ENV multiple values use line continuations", () => {
    assert.equal(
      dockerfile().env({ NODE_ENV: "production", PORT: "3000" }).build(),
      "ENV NODE_ENV=production \\\n    PORT=3000",
    );
  });

  test("ENV value with spaces gets quoted", () => {
    assert.equal(dockerfile().env({ MSG: "hello world" }).build(), 'ENV MSG="hello world"');
  });

  test("EXPOSE", () => {
    assert.equal(dockerfile().expose(3000).build(), "EXPOSE 3000");
  });

  test("CMD renders exec form", () => {
    assert.equal(
      dockerfile().cmd(["node", "./dist/server/index.mjs"]).build(),
      'CMD [ "node", "./dist/server/index.mjs" ]',
    );
  });

  // ── Stage type tracking ──────────────────────────────────────────────────────

  test("from with as makes the stage available to copy --from", () => {
    // Type-level: `.copy({ from })` only accepts declared stage names; this
    // compiling is the assertion. Runtime check confirms the rendered output.
    const out = dockerfile()
      .from("oven/bun:1", { as: "base" })
      .from("base", { as: "install" })
      .copy(["node_modules"], "node_modules", { from: "base" })
      .copy(["node_modules"], "node_modules", { from: "install" })
      .build();
    assert.match(out, /COPY --from=base/);
    assert.match(out, /COPY --from=install/);
  });

  // ── Composition ───────────────────────────────────────────────────────────────

  test(".when() applies the callback only when true", () => {
    assert.match(
      dockerfile()
        .from("node:20", { as: "base" })
        .when(true, (b) => b.env({ DEV: "1" }))
        .build(),
      /ENV DEV=1/,
    );
    assert.notMatch(
      dockerfile()
        .from("node:20", { as: "base" })
        .when(false, (b) => b.env({ DEV: "1" }))
        .build(),
      /ENV/,
    );
  });

  test(".pipe() applies a reusable step group", () => {
    const out = dockerfile()
      .from("node:20", { as: "base" })
      .pipe((b) => {
        for (const dep of ["a", "b"]) b.copy([dep], ".");
      })
      .build();
    assert.match(out, /COPY a \./);
    assert.match(out, /COPY b \./);
  });

  // ── Integration: representative multi-stage layout ───────────────────────────

  test("renders a multi-stage build", () => {
    const out = dockerfile()
      .from("node:24-alpine", { as: "deps", comment: "install dependencies" })
      .workdir("/app")
      .copy(["package.json", "package-lock.json*"], "./")
      .run("npm ci")
      .from("node:24-alpine", { as: "builder", comment: "build the application" })
      .workdir("/app")
      .copy(["/app/node_modules"], "./node_modules", { from: "deps" })
      .copy(["."], ".")
      .run("npm run build")
      .from("node:24-alpine", { as: "runner", comment: "production runtime image" })
      .workdir("/app")
      .env({ NODE_ENV: "production", PORT: "3000" })
      .copy(["/app/dist"], "./dist", { from: "builder" })
      .expose(3000)
      .cmd(["node", "./dist/server/index.mjs"])
      .build();

    assert.match(out, /# install dependencies\nFROM node:24-alpine AS deps/);
    assert.match(out, /FROM node:24-alpine AS builder/);
    assert.match(out, /COPY --from=deps \/app\/node_modules \.\/node_modules/);
    assert.match(out, /COPY --from=builder \/app\/dist \.\/dist/);
    assert.match(out, /EXPOSE 3000/);
    assert.match(out, /CMD \[ "node", ".\/dist\/server\/index\.mjs" \]/);
  });
});

describe("dockerPackageManager", () => {
  // Guards against malformed install commands per package manager — the path
  // e2e can't reach because tests run under a single package manager.
  for (const frozenLockfile of [true, false]) {
    for (const name of ["pnpm", "yarn", "bun", "npm", "unknown"]) {
      test(`${name} install commands are well-formed (frozen=${frozenLockfile})`, () => {
        const { install, installProd } = dockerPackageManager(name, { frozenLockfile });
        for (const cmd of [install, installProd]) {
          assert.notMatch(cmd, /[{}]/, `unexpected brace in "${cmd}"`);
          assert.match(cmd, /^(pnpm|yarn|bun|npm) /);
        }
      });
    }
  }

  test("frozen lockfile toggles the install flags", () => {
    assert.equal(dockerPackageManager("pnpm", { frozenLockfile: true }).install, "pnpm install --frozen-lockfile");
    assert.equal(dockerPackageManager("pnpm", { frozenLockfile: false }).install, "pnpm install");
    assert.equal(
      dockerPackageManager("pnpm", { frozenLockfile: true }).installProd,
      "pnpm install --frozen-lockfile --prod",
    );
    assert.equal(dockerPackageManager("npm", { frozenLockfile: true }).install, "npm ci");
    assert.equal(dockerPackageManager("npm", { frozenLockfile: false }).install, "npm install");
    assert.equal(dockerPackageManager("npm", { frozenLockfile: true }).installProd, "npm ci --omit=dev");
  });

  test("bun uses the bun image, others the node image", () => {
    assert.equal(dockerPackageManager("bun", { frozenLockfile: true }).image, "oven/bun:1-alpine");
    assert.equal(dockerPackageManager("pnpm", { frozenLockfile: true }).image, "node:24-alpine");
    assert.equal(dockerPackageManager("unknown", { frozenLockfile: true }).image, "node:24-alpine");
  });

  test("only pnpm and yarn enable corepack", () => {
    assert.equal(dockerPackageManager("pnpm", { frozenLockfile: true }).corepack, true);
    assert.equal(dockerPackageManager("yarn", { frozenLockfile: true }).corepack, true);
    assert.equal(dockerPackageManager("bun", { frozenLockfile: true }).corepack, false);
    assert.equal(dockerPackageManager("npm", { frozenLockfile: true }).corepack, false);
  });
});
