import { expect, test } from "vitest";
import { describeMany } from "./utils.js";

["express", "hattip", "h3"].forEach((server) =>
  describeMany(["solid", "react", "vue"], [server, "telefunc"], ({ fetch }) => {
    test("home", async () => {
      const res = await fetch("/");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });

    test("todo", async () => {
      const res = await fetch("/todo");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });

    test("telefunc", async () => {
      const res = await fetch("/_telefunc", {
        method: "post",
      });
      expect(res.status).toBe(400);
      expect(await res.text()).not.toContain('{"is404":true}');
    });
  }),
);
