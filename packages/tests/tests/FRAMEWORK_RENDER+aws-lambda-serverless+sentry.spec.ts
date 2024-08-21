import { existsSync } from "node:fs";
import path from "node:path";
import * as process from "process";
import { describeBati, npmCli, exec } from "@batijs/tests-utils";

export const matrix = ["aws-lambda-serverless", "react", ["hono", "hattip"], ["sentry", undefined]] as const;

await describeBati(
  ({ test, expect, beforeAll }) => {
    beforeAll(
      async () => {
        await exec(npmCli, ["run", "sls", "package"]);
      },
      2 * 60 * 1000,
    );

    test("render homepage", async () => {
      expect(existsSync(path.join(process.cwd(), ".serverless", "vike-dev.zip"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), ".serverless", "cloudformation-template-create-stack.json"))).toBe(
        true,
      );
      expect(existsSync(path.join(process.cwd(), ".serverless", "serverless-state.json"))).toBe(true);
      expect(existsSync(path.join(process.cwd(), ".serverless", "vike-dev.zip"))).toBe(true);
      await exec("unzip", [path.join(process.cwd(), ".serverless", "vike-dev.zip"), "-d", ".serverless/vike-dev"]);
      expect(existsSync(path.join(process.cwd(), ".serverless", "vike-dev", "entry_aws_lambda.mjs"))).toBe(true);

      const { handler } = await import(path.join(process.cwd(), ".serverless", "vike-dev", "entry_aws_lambda.mjs"));
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
    });
  },
  {
    mode: "build",
  },
);
