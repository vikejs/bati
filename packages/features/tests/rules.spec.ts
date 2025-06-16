import { expect, test } from "vitest";
import { RulesMessage } from "../src/rules/index.js";
import { exclusive, prepare, requires } from "../src/rules/utils.js";

test("requires - simple", () => {
  const simpleRequires = requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]);

  expect(simpleRequires(prepare(["hono"]))).toBeFalsy();
  expect(simpleRequires(prepare(["plausible.io"]))).toBeFalsy();
  expect(simpleRequires(prepare(["authjs", "hono"]))).toBeFalsy();
  expect(simpleRequires(prepare(["authjs", "Server"]))).toBeFalsy();
  expect(simpleRequires(prepare(["Auth", "hono"]))).toBeFalsy();
  expect(simpleRequires(prepare(["Auth", "Server"]))).toBeFalsy();

  expect(simpleRequires(prepare(["authjs"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(simpleRequires(prepare(["Auth", "authjs", "telefunc"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});

test("requires - extended", () => {
  const extendedRequires = requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server", "solid"]);

  expect(extendedRequires(prepare(["hono"]))).toBeFalsy();
  expect(extendedRequires(prepare(["plausible.io"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "hono"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "Server"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "authjs", "telefunc"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "Server", "solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["authjs", "Server", "solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["authjs"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(extendedRequires(prepare(["authjs", "hono"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(extendedRequires(prepare(["authjs", "hono", "UI Framework"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});

test("exclusive", () => {
  const simpleExclusive = exclusive(RulesMessage.ERROR_AUTH_R_SERVER, ["Server", "plausible.io"]);

  expect(simpleExclusive(prepare(["hono"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["plausible.io"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["authjs", "hono"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["authjs", "Server"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["Server", "Analytics"]))).toBeFalsy();

  expect(simpleExclusive(prepare(["Server", "plausible.io"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(simpleExclusive(prepare(["hono", "plausible.io"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});
