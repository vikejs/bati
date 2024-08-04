import { describeBati, exec, npmCli } from "@batijs/tests-utils";

export const matrix = [
  ["solid", "react", "vue"],
  ["express", "h3", "hono", "fastify", "hattip"],
  "lucia-auth",
  ["drizzle", undefined],
  "eslint",
] as const;

await describeBati(({ test, expect, fetch, context, beforeAll }) => {
  beforeAll(async () => {
    if (context.flags.includes("drizzle")) {
      await exec(npmCli, ["run", "drizzle:generate"]);
      await exec(npmCli, ["run", "drizzle:migrate"]);
    }
    return;
  }, 10000);

  test("login page", async () => {
    const res = await fetch("/login");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  test("signup & login", async () => {
    const signupRes = await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({ username: "usertest", password: "password" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(await signupRes.text()).toContain('{"status":"success"}');
    expect(signupRes.status).toBe(200);

    const loginRes = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username: "usertest", password: "password" }),
      headers: { "Content-Type": "application/json" },
    });
    expect(await loginRes.text()).toContain('{"status":"success"}');
    expect(loginRes.status).toBe(200);
  });

  test("/api/login/github", async () => {
    if (!process.env.TEST_GITHUB_CLIENT_ID) {
      return;
    }
    const res = await fetch("/api/login/github", {
      redirect: "manual",
    });
    expect(res.status).toBe(302);
  });
});
