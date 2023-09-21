import { expect, test } from "vitest";
import { exclusive, prepare, requires } from "../src/conflicts/utils";

test("prepare", () => {
  expect(prepare(["server:hattip"])).toEqual(new Set(["server:hattip", "server"]));
  expect(prepare(["auth", "server"])).toEqual(new Set(["auth", "server"]));
  expect(prepare(["auth:authjs", "server:hattip"])).toEqual(
    new Set(["auth:authjs", "server:hattip", "auth", "server"]),
  );
});

test("requires - simple", () => {
  const simpleRequires = requires("ERROR", "auth", ["server"]);

  expect(simpleRequires(prepare(["server:hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["analytics:plausible.io"]))).toBeFalsy();
  expect(simpleRequires(prepare(["auth:authjs", "server:hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["auth:authjs", "server"]))).toBeFalsy();
  expect(simpleRequires(prepare(["auth", "server:hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["auth", "server"]))).toBeFalsy();

  expect(simpleRequires(prepare(["auth:authjs"]))).toEqual("ERROR");
  expect(simpleRequires(prepare(["auth", "db:edgedb", "rpc:telefunc"]))).toEqual("ERROR");
});

test("requires - extended", () => {
  const extendedRequires = requires("ERROR", "auth:authjs", ["server", "framework:solid"]);

  expect(extendedRequires(prepare(["server:hattip"]))).toBeFalsy();
  expect(extendedRequires(prepare(["analytics:plausible.io"]))).toBeFalsy();
  expect(extendedRequires(prepare(["auth", "server:hattip"]))).toBeFalsy();
  expect(extendedRequires(prepare(["auth", "server"]))).toBeFalsy();
  expect(extendedRequires(prepare(["auth", "db:edgedb", "rpc:telefunc"]))).toBeFalsy();
  expect(extendedRequires(prepare(["auth", "server", "framework:solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["auth:authjs", "server", "framework:solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["auth:authjs"]))).toEqual("ERROR");
  expect(extendedRequires(prepare(["auth:authjs", "server:hattip"]))).toEqual("ERROR");
  expect(extendedRequires(prepare(["auth:authjs", "server:hattip", "framework"]))).toEqual("ERROR");
});

test("exclusive", () => {
  const simpleExclusive = exclusive("ERROR", ["server", "analytics:plausible.io"]);

  expect(simpleExclusive(prepare(["server:hattip"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["analytics:plausible.io"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["auth:authjs", "server:hattip"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["auth:authjs", "server"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["server", "analytics"]))).toBeFalsy();

  expect(simpleExclusive(prepare(["server", "analytics:plausible.io"]))).toEqual("ERROR");
  expect(simpleExclusive(prepare(["server:hattip", "analytics:plausible.io"]))).toEqual("ERROR");
});
