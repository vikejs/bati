/*
hono-entry_aws_lambda.ts

This file is the entry point for AWS Lambda

Notes:
* The file name must not have any special characters or dots except for the extension. https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax

*/

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { handle } from "hono/aws-lambda";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
// @ts-ignore
import app from "./hono-entry.js"; // file is provided by hono

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

const lambdaApp = new Hono<{ Bindings: Bindings }>();

lambdaApp.use(
  "/assets/*",
  serveStatic({
    root: `./dist/client/`,
  }),
);

lambdaApp.route("/", app!);

export const handler = handle(lambdaApp);
