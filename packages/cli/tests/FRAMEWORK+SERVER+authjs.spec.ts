import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

["express", "hattip", "h3"].forEach((server) =>
  describeMany(["solid", "react", "vue"], [server, "authjs"], ({ fetch }) => {
    test("home", async () => {
      const res = await fetch("/");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });

    test("auth/signin", async () => {
      const res = await fetch("/api/auth/signin");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });
  }),
);
