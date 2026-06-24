import { flags } from "@batijs/features";
import { describe, expect, test } from "vitest";
import { requiresEnv } from "./e2e/verify.js";

describe("verify metadata", () => {
  test("every requiresEnv key is a real feature flag", () => {
    for (const key of Object.keys(requiresEnv)) expect(flags).toContain(key);
  });
});
