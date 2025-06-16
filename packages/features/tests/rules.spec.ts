import { expect, test } from "vitest";
import { RulesMessage } from "../src/rules/index.js";
import { exclusive, prepare, requires } from "../src/rules/utils.js";

test("requires - simple", () => {
  const simpleRequires = requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server"]);

  expect(simpleRequires(prepare(["hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["plausible.io"]))).toBeFalsy();
  expect(simpleRequires(prepare(["authjs", "hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["authjs", "Server"]))).toBeFalsy();
  expect(simpleRequires(prepare(["Auth", "hattip"]))).toBeFalsy();
  expect(simpleRequires(prepare(["Auth", "Server"]))).toBeFalsy();

  expect(simpleRequires(prepare(["authjs"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(simpleRequires(prepare(["Auth", "authjs", "telefunc"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});

test("requires - extended", () => {
  const extendedRequires = requires(RulesMessage.ERROR_AUTH_R_SERVER, "Auth", ["Server", "solid"]);

  expect(extendedRequires(prepare(["hattip"]))).toBeFalsy();
  expect(extendedRequires(prepare(["plausible.io"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "hattip"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "Server"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "authjs", "telefunc"]))).toBeFalsy();
  expect(extendedRequires(prepare(["Auth", "Server", "solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["authjs", "Server", "solid"]))).toBeFalsy();

  expect(extendedRequires(prepare(["authjs"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(extendedRequires(prepare(["authjs", "hattip"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(extendedRequires(prepare(["authjs", "hattip", "UI Framework"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});

test("exclusive", () => {
  const simpleExclusive = exclusive(RulesMessage.ERROR_AUTH_R_SERVER, ["Server", "plausible.io"]);

  expect(simpleExclusive(prepare(["hattip"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["plausible.io"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["authjs", "hattip"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["authjs", "Server"]))).toBeFalsy();
  expect(simpleExclusive(prepare(["Server", "Analytics"]))).toBeFalsy();

  expect(simpleExclusive(prepare(["Server", "plausible.io"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
  expect(simpleExclusive(prepare(["hattip", "plausible.io"]))).toEqual(RulesMessage.ERROR_AUTH_R_SERVER);
});
