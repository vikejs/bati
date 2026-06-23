// The single E2E spec, shared by every project. A combo runs in three passes:
//   1. primary — boot the app in its `mode`, run every assertion (each self-gates on flags)
//   2. smoke   — re-run "/" once the app is built/containerized (multi-mode combos only)
//   3. checks  — lint / typecheck / knip (and cloudflare's deploy --dry-run), last so builds exist
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Flags } from "@batijs/features";
import { exec, npmCli } from "@batijs/tests-utils";
import { beforeAll, describe, expect } from "vitest";
import {
  appDir,
  appUrl,
  BATI,
  expectHome,
  flags,
  kind,
  mode,
  runScript,
  smoke,
  smokeMode,
  test,
  useApp,
  useAppFor,
} from "./fixtures.js";

const server = mode !== "none";
const needsSetup = BATI.has("cloudflare") || kind === "data" || kind === "auth";

describe.sequential(flags.join("+"), () => {
  describe(mode, () => {
    if (server && needsSetup) beforeAll(prepareApp, 70_000);
    useApp();

    uiLibraries();
    css();
    sentry();
    storybook();
    skills();
    linterComments();
    prismaTodo();
    dokployArtifacts();
    aws();

    if (server) {
      test("/ responds 200", ({ fetch }) => expectHome(fetch));
      analytics();
      dataRoundTrip();
      auth();
    }
  });

  if (smoke) {
    describe(`smoke (${smokeMode})`, () => {
      useAppFor(smokeMode);
      test("/ responds 200", { retry: smokeMode === "preview" ? 3 : 0 }, ({ fetch }) => expectHome(fetch));
    });
  }

  describe("checks", () => {
    checks();
    cloudflare();
  });
});

// Tables / worker types must exist before the dev server starts. Match on the tool first.
async function prepareApp() {
  if (BATI.has("cloudflare")) await runScript("generate-types");
  if (BATI.has("drizzle")) {
    await runScript("drizzle:generate");
    await runScript("drizzle:migrate");
  } else if (kind === "auth" && BATI.has("better-auth"))
    await runScript(BATI.has("cloudflare") ? "d1:migrate" : "better-auth:migrate");
  else if (BATI.hasD1) await runScript("d1:migrate");
  else if (BATI.has("kysely")) await runScript("kysely:migrate");
  else if (BATI.has("sqlite")) await runScript("sqlite:migrate");
  else if (BATI.has("postgres")) await runScript("postgres:migrate");
}

function uiLibraries() {
  if (BATI.has("compiled-css"))
    test("ui: @compiled/react", async () => {
      expect(await readFile("package.json", "utf-8")).toContain("@compiled/react");
    });
  if (BATI.has("mantine"))
    test("ui: @mantine/core styles", async () => {
      expect(await readFile("pages/+Layout.tsx", "utf-8")).toContain("@mantine/core/styles.css");
    });
}

function css() {
  if (BATI.has("daisyui"))
    test("css: tailwind.css includes daisyui", async () => {
      expect(await readFile("pages/tailwind.css", "utf-8")).toContain("daisyui");
    });
  if (BATI.has("tailwindcss") && !BATI.has("daisyui"))
    test("css: tailwind.css without daisyui", async () => {
      expect(await readFile("pages/tailwind.css", "utf-8")).not.toContain("daisyui");
    });
}

function sentry() {
  if (!BATI.has("sentry")) return;
  const fw = (f: Flags) => BATI.has(f);

  test("sentry: pages/+client.ts by framework", () => {
    expect(existsSync("pages/+client.ts")).toBe(!fw("vue"));
  });
  test("sentry: .env DSN keys", () => {
    const env = readFileSync(".env", "utf-8");
    expect(env).toContain("SENTRY_DSN=");
    expect(env).toContain("PUBLIC_ENV__SENTRY_DSN=");
  });
  test("sentry: .env.sentry-build-plugin keys", () => {
    const env = readFileSync(".env.sentry-build-plugin", "utf-8");
    for (const key of ["SENTRY_ORG=", "SENTRY_PROJECT=", "SENTRY_AUTH_TOKEN="]) expect(env).toContain(key);
  });
  test("sentry: vite plugin wired", () => {
    const cfg = readFileSync("vite.config.ts", "utf-8");
    expect(cfg).toContain('from "@sentry/vite-plugin"');
    expect(cfg).toContain("sentryVitePlugin");
  });
  test("sentry: browser config import", () => {
    const c = readFileSync("sentry.browser.config.ts", "utf-8");
    if (fw("react")) expect(c).toContain('from "@sentry/react"');
    else if (fw("solid")) expect(c).toContain('from "@sentry/solid"');
    else if (fw("vue")) {
      expect(c).toContain('from "@sentry/vue"');
      expect(c).toContain("app: getCurrentInstance()");
      expect(readFileSync("pages/+Layout.vue", "utf-8")).toContain("sentryBrowserConfig");
    } else expect(c).toContain('from "@sentry/browser"');
  });
  test("sentry: +Page by framework", () => {
    if (fw("vue")) expect(existsSync("pages/sentry/+Page.vue")).toBe(true);
    else if (fw("react") || fw("solid")) expect(existsSync("pages/sentry/+Page.tsx")).toBe(true);
    else expect(existsSync("pages/sentry/+Page.js") && existsSync("pages/sentry/+client.js")).toBe(true);
  });
  test("sentry: TODO.md", () => expect(existsSync("TODO.md")).toBe(true));
}

function storybook() {
  if (!BATI.has("storybook")) return;
  test("storybook: config file", () => {
    expect(["ts", "js", "mjs", "cjs"].some((e) => existsSync(`.storybook/main.${e}`))).toBe(true);
  });
  test("storybook: package.json scripts", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    expect(pkg.scripts?.storybook).toBeTruthy();
    expect(pkg.scripts?.["build-storybook"]).toBeTruthy();
  });
}

function skills() {
  if (!BATI.hasAiAgent) return;
  const has = (name: string) =>
    existsSync(join(".agents", "skills", name, "SKILL.md")) || existsSync(join(".claude", "skills", name, "SKILL.md"));

  test("skills: AGENTS.md has stack", () => {
    expect(readFileSync("AGENTS.md", "utf-8")).toContain("## Stack");
  });
  test("skills: vike-core skills present", () => {
    const core = [
      "vike-routing",
      "vike-data-fetching",
      "vike-config",
      "vike-navigation",
      "vike-render-modes",
      "vike-pagecontext",
      "vike-hooks",
      "vike-error-pages",
    ];
    for (const name of core) expect(has(name), name).toBe(true);
  });
  if (BATI.has("claude"))
    test("skills: claude shim", () => {
      expect(readFileSync("CLAUDE.md", "utf-8")).toContain("@AGENTS.md");
      expect(existsSync(join(".claude", "skills", "vike-routing", "SKILL.md"))).toBe(true);
    });
  if (BATI.has("gemini"))
    test("skills: gemini shim", () => {
      expect(readFileSync("GEMINI.md", "utf-8")).toContain("@./AGENTS.md");
      expect(existsSync(join(".agents", "skills", "vike-routing", "SKILL.md"))).toBe(true);
    });
  if (BATI.has("drizzle"))
    test("skills: backend skills", () => {
      expect(has("server") && has("trpc")).toBe(true);
      expect(readFileSync(join(".agents", "skills", "drizzle", "SKILL.md"), "utf-8")).toContain(
        "Drizzle ORM on SQLite",
      );
    });
  if (BATI.has("tailwindcss"))
    test("skills: frontend skills", () => {
      expect(has("styling") && has("deploy") && has("analytics")).toBe(true);
    });
}

function linterComments() {
  const onlyLinter = (l: Flags) =>
    BATI.has(l) && (["eslint", "biome", "oxlint"] as const).filter((x) => BATI.has(x)).length === 1;
  if (onlyLinter("eslint")) test("no biome/oxlint directives", () => assertAbsent("biome-", "oxlint-"));
  if (onlyLinter("biome")) test("no eslint directives", () => assertAbsent("eslint-"));
  if (onlyLinter("oxlint")) test("no biome directives", () => assertAbsent("biome-"));
}

function prismaTodo() {
  if (BATI.has("prisma")) test("prisma: TODO.md", () => expect(existsSync("TODO.md")).toBe(true));
}

function dokployArtifacts() {
  if (!BATI.has("dokploy")) return;
  const compose = () => readFileSync(join(appDir, "docker-compose.yml"), "utf8");
  test("dokploy: Dockerfile", () => expect(existsSync(join(appDir, "Dockerfile"))).toBe(true));
  test("dokploy: docker-compose serves on 3000", () => {
    expect(compose()).toContain("Dockerfile");
    expect(compose()).toContain("3000");
  });
  if (BATI.has("drizzle"))
    test("dokploy: compose passes DATABASE_URL", () => expect(compose()).toContain("DATABASE_URL"));
  if (BATI.has("auth0"))
    test("dokploy: compose passes AUTH0_CLIENT_ID", () => expect(compose()).toContain("AUTH0_CLIENT_ID"));
}

function aws() {
  if (!BATI.has("aws")) return;
  beforeAll(() => {
    if (existsSync(join(appDir, "cdk.out"))) rmSync(join(appDir, "cdk.out"), { recursive: true });
    execSync(`${npmCli} cdk --json --build "${npmCli} run build" synth`, {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      timeout: 90_000,
      cwd: appDir,
    });
  }, 120_000);

  test("aws: entry_aws_lambda.ts wired", () => {
    expect(readFileSync(join(appDir, "entry_aws_lambda.ts"), "utf-8")).toContain('from "hono/aws-lambda"');
  });
  test("aws: Lambda handler serves a page", async () => {
    const { handler } = await import(join(appDir, "cdk.out", requestHandlerAsset(), "index.mjs"));
    const response = await handler(GET_ROOT_EVENT, {});
    expect(response.statusCode).toBe(200);
    const body = response.isBase64Encoded ? Buffer.from(response.body, "base64").toString("utf8") : response.body;
    expect(body).toContain("My Vike App");
  });
  test("aws: TODO.md", () => expect(existsSync(join(appDir, "TODO.md"))).toBe(true));
}

function analytics() {
  if (BATI.has("plausible.io"))
    test("analytics: plausible script", async ({ fetch }) => {
      const html = await (await fetch("/")).text();
      expect(html).toContain("plausible.io");
      expect(html).not.toContain("googletagmanager");
      expect(existsSync("TODO.md")).toBe(true);
    });
  if (BATI.has("google-analytics"))
    test("analytics: google tag", async ({ fetch }) => {
      const html = await (await fetch("/")).text();
      expect(html).not.toContain("plausible.io");
      if (BATI.has("vue")) {
        expect((await fetch("/pages/+onCreateApp.ts")).status).toBe(200);
      } else {
        expect(html).toContain("googletagmanager");
        expect((await fetch("/pages/+onCreateApp.ts")).status).toBe(404);
      }
      expect(existsSync("TODO.md")).toBe(false);
    });
}

function dataRoundTrip() {
  if (kind !== "data") return;
  const db = BATI.hasDatabase;

  test("todo route", async ({ fetch }) => {
    const res = await fetch("/todo");
    expect(res.status).toBe(200);
    expect(await res.text()).not.toContain('{"is404":true}');
  });

  describe.sequential("create a todo", () => {
    const text = "__BATI_TEST_VALUE";
    if (BATI.has("telefunc"))
      test("post via telefunc", async ({ fetch }) => {
        const res = await fetch("/_telefunc", {
          method: "POST",
          body: JSON.stringify({ file: "/pages/todo/TodoList.telefunc.ts", name: "onNewTodo", args: [{ text }] }),
          headers: { "content-type": "application/json" },
        });
        expect(res.status).toBe(200);
      });
    if (BATI.has("trpc"))
      test("post via trpc", async ({ fetch }) => {
        const res = await fetch("/api/trpc/onNewTodo", {
          method: "POST",
          body: JSON.stringify(text),
          headers: { "content-type": "application/json" },
        });
        expect(res.status).toBe(200);
      });
    if (!BATI.has("telefunc") && !BATI.has("trpc"))
      test("post via rest", async ({ fetch }) => {
        const res = await fetch("/api/todo/create", {
          method: "POST",
          body: JSON.stringify({ text }),
          headers: { "content-type": "application/json" },
        });
        expect(res.status).toBe(200);
      });
    if (db)
      test("todo is persisted", async ({ fetch }) => {
        expect(await (await fetch("/todo")).text()).toContain(text);
      });
    test("TODO.md presence", () => {
      const expected = db || BATI.has("cloudflare") || BATI.has("dokploy");
      expect(existsSync("TODO.md")).toBe(expected);
    });
  });
}

function auth() {
  if (kind !== "auth") return;

  // Auth.js / Auth0 ship a built-in signin page; Better Auth ships its own login/signup/account pages.
  if (!BATI.has("better-auth")) {
    // Auth0's probe needs real credentials, which only CI provides. The matrix only emits auth0 combos
    // when the creds exist, but CI computes the combo list and runs combos in separate jobs whose env
    // can diverge — so a credential-less run is surfaced as an explained skip, not a silent gap.
    if (BATI.has("auth0") && !process.env.TEST_AUTH0_CLIENT_ID) {
      test.skip("auth: signin page — needs TEST_AUTH0_CLIENT_ID", () => {});
      return;
    }
    test("auth: signin page", async ({ fetch }) => {
      const res = await fetch("/api/auth/signin");
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    });
    return;
  }

  test("auth: better-auth pages", async ({ fetch }) => {
    for (const route of ["/login", "/signup", "/account"]) {
      const res = await fetch(route);
      expect(res.status).toBe(200);
      expect(await res.text()).not.toContain('{"is404":true}');
    }
  });

  test("auth: email/password flow", async ({ fetch }) => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = "Password123!";
    const headers = { "content-type": "application/json", origin: appUrl() };
    const post = (path: string, body: object) => fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
    expect((await post("/api/auth/sign-up/email", { name: "E2E User", email, password })).status).toBe(200);
    expect((await post("/api/auth/sign-in/email", { email, password })).status).toBe(200);
    expect((await post("/api/auth/sign-in/email", { email, password: "wrong-password" })).status).toBe(401);
  });

  test("auth: telefunc disabled", async ({ fetch }) => {
    expect((await fetch("/_telefunc", { method: "post" })).status).toBe(404);
  });
}

// lint/typecheck/knip — the targets the old nx pipeline ran per app.
function checks() {
  const TIMEOUT = 120_000;
  const cli = (...cmd: string[]) => exec(npmCli, ["x", ...cmd], { cwd: appDir, timeout: TIMEOUT });
  if (BATI.has("eslint")) test("eslint", () => cli("eslint", "--max-warnings", "0", "."), TIMEOUT);
  if (BATI.has("biome")) test("biome", () => cli("biome", "lint", "--error-on-warnings"), TIMEOUT);
  if (BATI.has("oxlint"))
    test(
      "oxlint",
      () => cli("oxlint", "--max-warnings", "0", "--type-aware", "--ignore-path", ".gitignore", "."),
      TIMEOUT,
    );
  // tsc rejects .ts files importing .vue modules, so storybook+vue has no typecheck (as upstream).
  if (!(BATI.has("storybook") && BATI.has("vue"))) test("typecheck", () => cli("tsc", "--noEmit"), TIMEOUT);
  test(
    "knip",
    () =>
      exec(npmCli, ["x", "knip", "--no-config-hints"], {
        cwd: appDir,
        timeout: TIMEOUT,
        env: { VITE_CJS_IGNORE_WARNING: "1" },
      }),
    TIMEOUT,
  );
}

function cloudflare() {
  if (kind !== "cloudflare") return;
  test("cloudflare: TODO.md", () => expect(existsSync(join(appDir, "TODO.md"))).toBe(true));
  test("cloudflare: deploy --dry-run", { retry: 3 }, () => runScript("deploy", "--dry-run"));
}

async function assertAbsent(...prefixes: string[]) {
  for await (const file of sourceFiles(".")) {
    const content = await readFile(file, "utf-8");
    for (const prefix of prefixes) expect(content, `${file} should not contain "${prefix}"`).not.toContain(prefix);
  }
}

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "build", ".vike", ".vercel", ".netlify", ".wrangler"]);
async function* sourceFiles(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) yield* sourceFiles(full);
    } else if (/\.(js|ts|jsx|tsx)$/.test(entry.name)) yield full;
  }
}

// The Lambda bundle is named by asset hash; find it via the CloudFormation template.
function requestHandlerAsset(): string {
  const cdkOut = join(appDir, "cdk.out");
  const template = readdirSync(cdkOut).find((f) => f.startsWith("VikeStack-") && f.endsWith(".template.json"));
  expect(template, "synthesized VikeStack template").toBeDefined();
  let asset: string | undefined;
  // biome-ignore lint/suspicious/noExplicitAny: arbitrary CloudFormation JSON
  const visit = (node: any) => {
    if (typeof node !== "object" || node === null) return;
    if (node["aws:cdk:path"]?.endsWith("/RequestHandler/Resource")) asset = node["aws:asset:path"];
    else for (const key in node) visit(node[key]);
  };
  visit(JSON.parse(readFileSync(join(cdkOut, template!), "utf8")));
  expect(asset, "RequestHandler asset path").toBeDefined();
  return asset!;
}

const GET_ROOT_EVENT = {
  version: "2.0",
  routeKey: "$default",
  rawPath: "/",
  rawQueryString: "",
  headers: { accept: "*/*", "content-length": "0", host: "example.com", "user-agent": "PostmanRuntime/7.26.8" },
  requestContext: {
    accountId: "123456789012",
    apiId: "api-id",
    domainName: "example.com",
    http: { method: "GET", path: "/", protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "PostmanRuntime/7.26.8" },
    requestId: "id",
    routeKey: "$default",
    stage: "$default",
    time: "12/Mar/2021:19:03:58 +0000",
    timeEpoch: 1615578238000,
  },
  isBase64Encoded: false,
};
