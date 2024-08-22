/*
entry_aws_lambda.ts

This file is the entry point for AWS Lambda

Notes:
* The file name must not have any special characters or dots except for the extension. https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax

*/

import * as Sentry from "@sentry/aws-serverless";

//# BATI.has("sentry")
import "@batijs/aws-lambda-serverless/sentry.config.server";

import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { handle } from "hono/aws-lambda";
import type { LambdaEvent, LambdaContext } from "hono/aws-lambda";
import app from "@batijs/hono/hono-entry"; // file is provided by hono
import type { Handler, APIGatewayProxyResult } from "aws-lambda";

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

const lambdaApp = new Hono<{ Bindings: Bindings }>();

lambdaApp.use(
  "/*",
  serveStatic({
    root: `./dist/client/`,
  }),
);

lambdaApp.route("/", app!);
const awsHandler = handle(lambdaApp);

export const handler: Handler<LambdaEvent, APIGatewayProxyResult> = BATI.has("sentry")
  ? Sentry.wrapHandler(awsHandler, { captureAllSettledReasons: true })
  : awsHandler;
