import { assert, describe, test } from "vitest";
import { DockerfileBuilder } from "../src/dockerfile.js";

describe("DockerfileBuilder", () => {
  test("FROM with AS and platform", () => {
    const out = new DockerfileBuilder().from("oven/bun:1", { as: "base", platform: "linux/amd64" }).build();
    assert.equal(out, "FROM --platform=linux/amd64 oven/bun:1 AS base");
  });

  test("FROM without options", () => {
    const out = new DockerfileBuilder().from("node:20").build();
    assert.equal(out, "FROM node:20");
  });

  test("WORKDIR", () => {
    const out = new DockerfileBuilder().workdir("/app").build();
    assert.equal(out, "WORKDIR /app");
  });

  test("RUN shell form", () => {
    const out = new DockerfileBuilder().run("bun install").build();
    assert.equal(out, "RUN bun install");
  });

  test("RUN exec form", () => {
    const out = new DockerfileBuilder().run(["bun", "install"]).build();
    assert.equal(out, 'RUN [ "bun", "install" ]');
  });

  test("RUN disabled (commented out)", () => {
    const out = new DockerfileBuilder().run("bun install --frozen-lockfile", { disabled: true }).build();
    assert.equal(out, "# RUN bun install --frozen-lockfile");
  });

  test("RUN with mount flag", () => {
    const out = new DockerfileBuilder()
      .run("apt-get install -y curl", { mount: "type=cache,target=/var/cache/apt" })
      .build();
    assert.equal(out, "RUN --mount=type=cache,target=/var/cache/apt apt-get install -y curl");
  });

  test("COPY basic", () => {
    const out = new DockerfileBuilder().copy(["package.json", "bun.lock*"], "/app/").build();
    assert.equal(out, "COPY package.json bun.lock* /app/");
  });

  test("COPY with --from", () => {
    const out = new DockerfileBuilder().copy(["node_modules"], "node_modules", { from: "install" }).build();
    assert.equal(out, "COPY --from=install node_modules node_modules");
  });

  test("COPY with --chown and --chmod", () => {
    const out = new DockerfileBuilder().copy(["app.js"], "/app/", { chown: "node:node", chmod: "755" }).build();
    assert.equal(out, "COPY --chown=node:node --chmod=755 app.js /app/");
  });

  test("CMD exec form", () => {
    const out = new DockerfileBuilder().cmd(["node", "server.js"]).build();
    assert.equal(out, 'CMD [ "node", "server.js" ]');
  });

  test("ENTRYPOINT exec form", () => {
    const out = new DockerfileBuilder().entrypoint(["bun", "run", "./dist/server/index.mjs"]).build();
    assert.equal(out, 'ENTRYPOINT [ "bun", "run", "./dist/server/index.mjs" ]');
  });

  test("ENV single", () => {
    const out = new DockerfileBuilder().env({ NODE_ENV: "production" }).build();
    assert.equal(out, "ENV NODE_ENV=production");
  });

  test("ENV value with spaces gets quoted", () => {
    const out = new DockerfileBuilder().env({ GREETING: "hello world" }).build();
    assert.equal(out, 'ENV GREETING="hello world"');
  });

  test("ENV multiple entries", () => {
    const out = new DockerfileBuilder().env({ NODE_ENV: "production", PORT: "3000" }).build();
    assert.match(out, /ENV/);
    assert.match(out, /NODE_ENV=production/);
    assert.match(out, /PORT=3000/);
  });

  test("ARG with default", () => {
    const out = new DockerfileBuilder().arg("VERSION", { default: "1.0" }).build();
    assert.equal(out, "ARG VERSION=1.0");
  });

  test("ARG without default", () => {
    const out = new DockerfileBuilder().arg("SECRET").build();
    assert.equal(out, "ARG SECRET");
  });

  test("LABEL", () => {
    const out = new DockerfileBuilder().label({ maintainer: "team@example.com" }).build();
    assert.equal(out, 'LABEL maintainer="team@example.com"');
  });

  test("EXPOSE with protocol", () => {
    const out = new DockerfileBuilder().expose(3000, { protocol: "tcp" }).build();
    assert.equal(out, "EXPOSE 3000/tcp");
  });

  test("EXPOSE without protocol", () => {
    const out = new DockerfileBuilder().expose(8080).build();
    assert.equal(out, "EXPOSE 8080");
  });

  test("USER", () => {
    const out = new DockerfileBuilder().user("bun").build();
    assert.equal(out, "USER bun");
  });

  test("VOLUME single path", () => {
    const out = new DockerfileBuilder().volume("/data").build();
    assert.equal(out, "VOLUME /data");
  });

  test("VOLUME multiple paths", () => {
    const out = new DockerfileBuilder().volume("/data", "/logs").build();
    assert.equal(out, 'VOLUME [ "/data", "/logs" ]');
  });

  test("HEALTHCHECK with options", () => {
    const out = new DockerfileBuilder()
      .healthcheck("curl -f http://localhost/ || exit 1", {
        interval: "30s",
        timeout: "10s",
        retries: 3,
      })
      .build();
    assert.equal(out, "HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD curl -f http://localhost/ || exit 1");
  });

  test("HEALTHCHECK NONE", () => {
    const out = new DockerfileBuilder().healthcheck(null).build();
    assert.equal(out, "HEALTHCHECK NONE");
  });

  test("SHELL", () => {
    const out = new DockerfileBuilder().shell(["/bin/bash", "-c"]).build();
    assert.equal(out, 'SHELL [ "/bin/bash", "-c" ]');
  });

  test("STOPSIGNAL", () => {
    const out = new DockerfileBuilder().stopsignal("SIGTERM").build();
    assert.equal(out, "STOPSIGNAL SIGTERM");
  });

  test("ONBUILD", () => {
    const out = new DockerfileBuilder().onbuild("RUN echo hello").build();
    assert.equal(out, "ONBUILD RUN echo hello");
  });

  test("comment", () => {
    const out = new DockerfileBuilder().comment("hello world").build();
    assert.equal(out, "# hello world");
  });

  test("blank line", () => {
    const out = new DockerfileBuilder().from("node:20").blank().workdir("/app").build();
    assert.equal(out, "FROM node:20\n\nWORKDIR /app");
  });

  test(".when() applies when true", () => {
    const out = new DockerfileBuilder()
      .from("node:20")
      .when(true, (b) => b.env({ DEV: "1" }))
      .build();
    assert.match(out, /ENV DEV=1/);
  });

  test(".when() skips when false", () => {
    const out = new DockerfileBuilder()
      .from("node:20")
      .when(false, (b) => b.env({ DEV: "1" }))
      .build();
    assert.notMatch(out, /ENV/);
  });

  test(".pipe() applies callback", () => {
    const addLabel = (b: DockerfileBuilder) => b.label({ team: "platform" });
    const out = new DockerfileBuilder().from("node:20").pipe(addLabel).build();
    assert.match(out, /LABEL team="platform"/);
  });

  test(".merge() combines builders", () => {
    const shared = new DockerfileBuilder().workdir("/app").env({ TZ: "UTC" });
    const out = new DockerfileBuilder().from("node:20").merge(shared).build();
    assert.match(out, /FROM node:20/);
    assert.match(out, /WORKDIR \/app/);
    assert.match(out, /ENV TZ=UTC/);
  });

  test("toString() equals build()", () => {
    const builder = new DockerfileBuilder().from("node:20").workdir("/app");
    assert.equal(builder.toString(), builder.build());
  });

  test("full multi-stage Bun Dockerfile", () => {
    const out = new DockerfileBuilder()
      .comment("use the official Bun image")
      .from("oven/bun:1", { as: "base" })
      .workdir("/usr/src/app")
      .blank()
      .from("base", { as: "install" })
      .run("mkdir -p /temp/dev")
      .copy(["package.json", "bun.lock*", "batijs-tests-utils-*.tgz"], "/temp/dev/")
      .run("cd /temp/dev && bun install")
      .run("cd /temp/dev && bun install --frozen-lockfile", { disabled: true })
      .blank()
      .from("base", { as: "release" })
      .user("bun")
      .expose(3000, { protocol: "tcp" })
      .entrypoint(["bun", "run", "./dist/server/index.mjs"])
      .build();

    assert.match(out, /^# use the official Bun image/);
    assert.match(out, /FROM oven\/bun:1 AS base/);
    assert.match(out, /WORKDIR \/usr\/src\/app/);
    assert.match(out, /FROM base AS install/);
    assert.match(out, /COPY package\.json bun\.lock\* batijs-tests-utils-\*\.tgz \/temp\/dev\//);
    assert.match(out, /# RUN cd \/temp\/dev && bun install --frozen-lockfile/);
    assert.match(out, /FROM base AS release/);
    assert.match(out, /USER bun/);
    assert.match(out, /EXPOSE 3000\/tcp/);
    assert.match(out, /ENTRYPOINT \[ "bun", "run", ".\/dist\/server\/index\.mjs" \]/);
  });
});
