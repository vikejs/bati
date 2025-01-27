import { beforeAll, describe, expect, it } from "vitest";

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import which from "which";

const bunExists = which.sync("bun", { nothrow: true }) !== null;
const npmCli = bunExists ? "bun" : "pnpm";

console.log("RUN TESTS ***");

describe("AWSHandler", () => {
  beforeAll(
    async () => {
      if (existsSync(path.join(process.cwd(), "cdk.out"))) {
        rmSync(path.join(process.cwd(), "cdk.out"), { recursive: true });
      }
      /*
       * `--build "${npmCli} run build"` is required to build the project before synth
       */
      const synthCommand = `${npmCli} cdk --json --build "${npmCli} run build" synth`;
      execSync(synthCommand, {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
        env: {
          BUN_LOCKFILE: "../../bun.lockb", // This is to make sure that the correct lockfile is used in a bun project
          PATH: process.env.PATH,
        },
      });
    },
    2 * 60 * 1000,
  );

  it("should request a page from the AWS handler", async () => {
    const cdkOutPath = path.join(process.cwd(), "cdk.out");
    const templateFilePath = readdirSync(cdkOutPath).find(
      (file) => file.startsWith("VikeStack-") && file.endsWith(".template.json"),
    );
    const templateFullPath = path.join(cdkOutPath, templateFilePath!);
    expect(existsSync(templateFullPath)).toBe(true);
    const cloudfrontTemplateJson = readFileSync(templateFullPath, "utf8");
    const requestHandlerFolder = extractRequestHandlerPath(
      JSON.parse(cloudfrontTemplateJson),
      "/RequestHandler/Resource",
    );
    const requestHandlerPath = path.join(process.cwd(), "cdk.out", requestHandlerFolder!, "index.mjs");
    expect(existsSync(requestHandlerPath)).toBe(true);

    const { handler } = await import(requestHandlerPath);
    const event = {
      version: "2.0",
      routeKey: "$default",
      rawPath: "/",
      rawQueryString: "",
      headers: {
        accept: "*/*",
        "content-length": "0",
        host: "example.com",
        "user-agent": "PostmanRuntime/7.26.8",
        "x-amzn-trace-id": "Root=1-5f84c7a9-0e5b1e1e1e1e1e1e1e1e1e1e",
        "x-forwarded-for": "127.0.0.1",
        "x-forwarded-port": "443",
        "x-forwarded-proto": "https",
      },
      requestContext: {
        accountId: "123456789012",
        apiId: "api-id",
        domainName: "example.com",
        domainPrefix: "example",
        http: {
          method: "GET",
          path: "/",
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "PostmanRuntime/7.26.8",
        },
        requestId: "id",
        routeKey: "$default",
        stage: "$default",
        time: "12/Mar/2021:19:03:58 +0000",
        timeEpoch: 1615578238000,
      },
      isBase64Encoded: false,
    };
    const response = await handler(event, {});
    expect(response.statusCode).toBe(200);
    const body = response.isBase64Encoded ? Buffer.from(response.body, "base64").toString("utf8") : response.body;
    expect(body).toContain("My Vike App");
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonData = Record<string, any>;

function extractRequestHandlerPath(jsonData: JsonData, targetCdkPath: string): string | null {
  let assetPath: string | null = null;

  function traverse(obj: JsonData) {
    if (typeof obj !== "object" || obj === null) return;

    if (obj?.["aws:cdk:path"]?.endsWith(targetCdkPath)) {
      assetPath = obj?.["aws:asset:path"];
      return;
    }

    for (const key in obj) {
      if (obj?.[key]) {
        traverse(obj[key]);
      }
    }
  }

  traverse(jsonData);
  return assetPath;
}
