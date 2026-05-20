import { assert, describe, test } from "vitest";
import { type DockerfileBuilder, dockerfile } from "../src/dockerfile.js";

describe("DockerfileBuilder", () => {
  // ── Comments ────────────────────────────────────────────────────────────────

  test("comment in options renders before instruction", () => {
    const out = dockerfile().from("node:20", { comment: "use official image", as: "base" }).build();
    assert.equal(out, "# use official image\nFROM node:20 AS base");
  });

  test("multi-line comment splits into multiple # lines", () => {
    const out = dockerfile().workdir("/app", { comment: "line one\nline two" }).build();
    assert.equal(out, "# line one\n# line two\nWORKDIR /app");
  });

  test("comment on run", () => {
    const out = dockerfile().run("bun install", { comment: "install deps" }).build();
    assert.equal(out, "# install deps\nRUN bun install");
  });

  test("comment on copy", () => {
    const out = dockerfile().copy(["dist"], "/app", { comment: "copy output" }).build();
    assert.equal(out, "# copy output\nCOPY dist /app");
  });

  test("comment on env", () => {
    const out = dockerfile().env({ NODE_ENV: "production" }, { comment: "set env" }).build();
    assert.equal(out, "# set env\nENV NODE_ENV=production");
  });

  test("no comment → no extra line", () => {
    const out = dockerfile().from("node:20", { as: "app" }).build();
    assert.equal(out, "FROM node:20 AS app");
  });

  // ── Stage type tracking ──────────────────────────────────────────────────────

  test("from with as returns builder that knows the stage", () => {
    // This is a type-level test: if it compiles, the type is correct.
    // We verify at runtime that the output is also correct.
    const out = dockerfile()
      .from("oven/bun:1", { as: "base" })
      .from("base", { as: "install" })
      .copy(["node_modules"], "node_modules", { from: "base" })
      .copy(["node_modules"], "node_modules", { from: "install" })
      .build();
    assert.match(out, /COPY --from=base/);
    assert.match(out, /COPY --from=install/);
  });

  test("merge propagates stage types", () => {
    const a = dockerfile().from("alpine", { as: "a" });
    const b = dockerfile().from("debian", { as: "b" });
    const merged = a.merge(b);
    // Both "a" and "b" are known after merge — type-checked at compile time
    const out = merged.copy(["x"], "y", { from: "a" }).copy(["x"], "y", { from: "b" }).build();
    assert.match(out, /--from=a/);
    assert.match(out, /--from=b/);
  });

  // ── FROM ────────────────────────────────────────────────────────────────────

  test("FROM with as", () => {
    const out = dockerfile().from("oven/bun:1", { as: "base" }).build();
    assert.equal(out, "FROM oven/bun:1 AS base");
  });

  test("FROM with platform", () => {
    const out = dockerfile().from("node:20", { as: "base", platform: "linux/amd64" }).build();
    assert.equal(out, "FROM --platform=linux/amd64 node:20 AS base");
  });

  test("FROM minimal (as only)", () => {
    assert.equal(dockerfile().from("node:20", { as: "app" }).build(), "FROM node:20 AS app");
  });

  // ── WORKDIR ─────────────────────────────────────────────────────────────────

  test("WORKDIR", () => {
    assert.equal(dockerfile().workdir("/app").build(), "WORKDIR /app");
  });

  // ── RUN ─────────────────────────────────────────────────────────────────────

  test("RUN shell form", () => {
    assert.equal(dockerfile().run("bun install").build(), "RUN bun install");
  });

  test("RUN exec form", () => {
    assert.equal(dockerfile().run(["bun", "install"]).build(), 'RUN [ "bun", "install" ]');
  });

  test("RUN disabled", () => {
    assert.equal(
      dockerfile().run("bun install --frozen-lockfile", { disabled: true }).build(),
      "# RUN bun install --frozen-lockfile",
    );
  });

  test("RUN with mount flag", () => {
    assert.equal(
      dockerfile().run("apt-get install -y curl", { mount: "type=cache,target=/var/cache/apt" }).build(),
      "RUN --mount=type=cache,target=/var/cache/apt apt-get install -y curl",
    );
  });

  // ── COPY ────────────────────────────────────────────────────────────────────

  test("COPY basic", () => {
    assert.equal(
      dockerfile().copy(["package.json", "bun.lock*"], "/app/").build(),
      "COPY package.json bun.lock* /app/",
    );
  });

  test("COPY with --from", () => {
    const out = dockerfile()
      .from("node:20", { as: "build" })
      .copy(["node_modules"], "node_modules", { from: "build" })
      .build();
    assert.match(out, /COPY --from=build node_modules node_modules/);
  });

  test("COPY with --chown and --chmod", () => {
    assert.equal(
      dockerfile().copy(["app.js"], "/app/", { chown: "node:node", chmod: "755" }).build(),
      "COPY --chown=node:node --chmod=755 app.js /app/",
    );
  });

  // ── ADD ─────────────────────────────────────────────────────────────────────

  test("ADD with keepGitDir", () => {
    assert.equal(
      dockerfile().add(["https://example.com/repo.git"], "/app", { keepGitDir: true }).build(),
      "ADD --keep-git-dir https://example.com/repo.git /app",
    );
  });

  // ── CMD / ENTRYPOINT ────────────────────────────────────────────────────────

  test("CMD exec form", () => {
    assert.equal(dockerfile().cmd(["node", "server.js"]).build(), 'CMD [ "node", "server.js" ]');
  });

  test("ENTRYPOINT exec form", () => {
    assert.equal(
      dockerfile().entrypoint(["bun", "run", "./dist/server/index.mjs"]).build(),
      'ENTRYPOINT [ "bun", "run", "./dist/server/index.mjs" ]',
    );
  });

  // ── ENV ─────────────────────────────────────────────────────────────────────

  test("ENV single value", () => {
    assert.equal(dockerfile().env({ NODE_ENV: "production" }).build(), "ENV NODE_ENV=production");
  });

  test("ENV value with spaces gets quoted", () => {
    assert.equal(dockerfile().env({ MSG: "hello world" }).build(), 'ENV MSG="hello world"');
  });

  // ── ARG ─────────────────────────────────────────────────────────────────────

  test("ARG with default", () => {
    assert.equal(dockerfile().arg("VERSION", { default: "1.0" }).build(), "ARG VERSION=1.0");
  });

  test("ARG without default", () => {
    assert.equal(dockerfile().arg("SECRET").build(), "ARG SECRET");
  });

  // ── LABEL ───────────────────────────────────────────────────────────────────

  test("LABEL single", () => {
    assert.equal(dockerfile().label({ maintainer: "team@example.com" }).build(), 'LABEL maintainer="team@example.com"');
  });

  // ── EXPOSE ──────────────────────────────────────────────────────────────────

  test("EXPOSE with protocol", () => {
    assert.equal(dockerfile().expose(3000, { protocol: "tcp" }).build(), "EXPOSE 3000/tcp");
  });

  test("EXPOSE without protocol", () => {
    assert.equal(dockerfile().expose(8080).build(), "EXPOSE 8080");
  });

  // ── VOLUME ──────────────────────────────────────────────────────────────────

  test("VOLUME single path", () => {
    assert.equal(dockerfile().volume(["/data"]).build(), "VOLUME /data");
  });

  test("VOLUME multiple paths", () => {
    assert.equal(dockerfile().volume(["/data", "/logs"]).build(), 'VOLUME [ "/data", "/logs" ]');
  });

  // ── USER ────────────────────────────────────────────────────────────────────

  test("USER", () => {
    assert.equal(dockerfile().user("bun").build(), "USER bun");
  });

  // ── HEALTHCHECK ─────────────────────────────────────────────────────────────

  test("HEALTHCHECK with options", () => {
    assert.equal(
      dockerfile()
        .healthcheck("curl -f http://localhost/ || exit 1", {
          interval: "30s",
          timeout: "10s",
          retries: 3,
        })
        .build(),
      "HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost/ || exit 1",
    );
  });

  test("HEALTHCHECK NONE", () => {
    assert.equal(dockerfile().healthcheck(null).build(), "HEALTHCHECK NONE");
  });

  // ── SHELL / STOPSIGNAL / ONBUILD ────────────────────────────────────────────

  test("SHELL", () => {
    assert.equal(dockerfile().shell(["/bin/bash", "-c"]).build(), 'SHELL [ "/bin/bash", "-c" ]');
  });

  test("STOPSIGNAL", () => {
    assert.equal(dockerfile().stopsignal("SIGTERM").build(), "STOPSIGNAL SIGTERM");
  });

  test("ONBUILD", () => {
    assert.equal(dockerfile().onbuild("RUN echo hello").build(), "ONBUILD RUN echo hello");
  });

  // ── Composition ─────────────────────────────────────────────────────────────

  test(".when() applies callback when true", () => {
    const out = dockerfile()
      .from("node:20", { as: "base" })
      .when(true, (b) => b.env({ DEV: "1" }))
      .build();
    assert.match(out, /ENV DEV=1/);
  });

  test(".when() skips callback when false", () => {
    const out = dockerfile()
      .from("node:20", { as: "base" })
      .when(false, (b) => b.env({ DEV: "1" }))
      .build();
    assert.notMatch(out, /ENV/);
  });

  test(".pipe() applies callback", () => {
    const addLabel = (b: DockerfileBuilder) => b.label({ team: "platform" });
    const out = dockerfile().from("node:20", { as: "base" }).pipe(addLabel).build();
    assert.match(out, /LABEL team="platform"/);
  });

  test(".merge() combines instructions and stages", () => {
    const shared = dockerfile().workdir("/app").env({ TZ: "UTC" });
    const out = dockerfile().from("node:20", { as: "base" }).merge(shared).build();
    assert.match(out, /FROM node:20 AS base/);
    assert.match(out, /WORKDIR \/app/);
    assert.match(out, /ENV TZ=UTC/);
  });

  test("toString() equals build()", () => {
    const b = dockerfile().from("node:20", { as: "base" }).workdir("/app");
    assert.equal(b.toString(), b.build());
  });

  // ── copy --from (type-checked stage names) ──────────────────────────────────

  test("copy --from a declared stage", () => {
    const out = dockerfile().from("oven/bun:1", { as: "build" }).copy(["dist"], "./dist", { from: "build" }).build();
    assert.equal(out, "FROM oven/bun:1 AS build\nCOPY --from=build dist ./dist");
  });

  test("copy --from with extra options", () => {
    const out = dockerfile()
      .from("node:20", { as: "deps" })
      .copy(["node_modules"], "node_modules", {
        from: "deps",
        chown: "node:node",
        comment: "copy deps",
      })
      .build();
    assert.match(out, /# copy deps\nCOPY --from=deps --chown=node:node node_modules node_modules/);
  });

  // Type-level: copy({ from }) is restricted to declared stage names only.
  // The following would be a TS compile error (verified separately):
  //   .copy(["x"], "y", { from: "typo" })  // ❌ "typo" not assignable to "build"

  // ── Full integration: Bun multi-stage ───────────────────────────────────────

  test("reproduces the Bun multi-stage Dockerfile", () => {
    const out = dockerfile()
      .from("oven/bun:1", {
        as: "base",
        comment: "use the official Bun image\nsee all versions at https://hub.docker.com/r/oven/bun/tags",
      })
      .workdir("/usr/src/app")
      .from("base", {
        as: "install",
        comment: "install dependencies into temp directory\nthis will cache them and speed up future builds",
      })
      .run("mkdir -p /temp/dev")
      .copy(["package.json", "bun.lock*", "batijs-tests-utils-*.tgz"], "/temp/dev/")
      .run("cd /temp/dev && bun install")
      .run("cd /temp/dev && bun install --frozen-lockfile", { disabled: true })
      .run("mkdir -p /temp/prod", { comment: "install with --production (exclude devDependencies)" })
      .copy(["package.json", "bun.lock*", "batijs-tests-utils-*.tgz"], "/temp/prod/")
      .run("cd /temp/prod && bun install --production")
      .run("cd /temp/prod && bun install --frozen-lockfile --production", { disabled: true })
      .from("base", {
        as: "prerelease",
        comment: "copy node_modules from temp directory\nthen copy all (non-ignored) project files into the image",
      })
      .copy(["/temp/dev/node_modules"], "node_modules", { from: "install" })
      .copy(["."], ".")
      .env({ NODE_ENV: "production" }, { comment: "[optional] tests & build" })
      .run("bun run build")
      .from("base", {
        as: "release",
        comment: "copy production dependencies and source code into final image",
      })
      .copy(["/temp/prod/node_modules"], "node_modules", { from: "install" })
      .copy(["/usr/src/app/dist"], "./dist", { from: "prerelease" })
      .copy(["/usr/src/app/package.json"], ".", { from: "prerelease" })
      .user("bun", { comment: "run the app" })
      .expose(3000, { protocol: "tcp" })
      .entrypoint(["bun", "run", "./dist/server/index.mjs"])
      .build();

    // Comments appear before their instructions (multi-line comment = multiple # lines)
    assert.match(out, /# use the official Bun image\n# see all versions at.*\nFROM oven\/bun:1 AS base/);
    assert.match(out, /# install dependencies into temp directory\n# this will cache them/);
    assert.match(out, /# \[optional\] tests & build\nENV NODE_ENV=production/);
    assert.match(out, /# run the app\nUSER bun/);
    // Disabled line
    assert.match(out, /# RUN cd \/temp\/dev && bun install --frozen-lockfile/);
    // Stage aliases
    assert.match(out, /FROM oven\/bun:1 AS base/);
    assert.match(out, /FROM base AS install/);
    assert.match(out, /FROM base AS prerelease/);
    assert.match(out, /FROM base AS release/);
    // Cross-stage COPY
    assert.match(out, /COPY --from=install \/temp\/dev\/node_modules node_modules/);
    assert.match(out, /COPY --from=prerelease \/usr\/src\/app\/dist \.\/dist/);
    // Final instructions
    assert.match(out, /EXPOSE 3000\/tcp/);
    assert.match(out, /ENTRYPOINT \[ "bun", "run", ".\/dist\/server\/index\.mjs" \]/);
  });
});
