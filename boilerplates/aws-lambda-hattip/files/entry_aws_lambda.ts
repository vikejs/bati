/*
entry_aws_lambda.ts

This file is the entry point for AWS Lambda

Notes:
* The file name must not have any special characters or dots except for the extension. https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax

*/

import { existsSync } from "node:fs";
import type { APIGatewayProxyHandler } from "aws-lambda";
import awsLambdaAdapter from "@hattip/adapter-aws-lambda";
import { walk } from "@hattip/walk";
import type { FileInfo } from "@hattip/walk";
import { createStaticMiddleware } from "@hattip/static";
import { createFileReader } from "@hattip/static/fs";
import hattipHandler from "@batijs/hattip/hattip-entry"; // file is provided by hattip

const root = new URL("./dist/client", import.meta.url);
const staticRootExists = existsSync(root);
const files = staticRootExists ? walk(root) : new Map<string, FileInfo>();
const staticMiddleware = staticRootExists
  ? createStaticMiddleware(files, createFileReader(root), {
      urlRoot: "/",
    })
  : undefined;

export const handler: APIGatewayProxyHandler = awsLambdaAdapter((ctx) => {
  if (staticMiddleware === undefined) return hattipHandler(ctx);
  return staticMiddleware(ctx) || hattipHandler(ctx);
});
