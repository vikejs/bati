/*{ @if (it.BATI.has("aws")) }*/
/*
entry_aws_lambda.ts

This file is the entry point for AWS Lambda

Notes:
* The file name must not have any special characters or dots except for the extension. https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax

*/

// @ts-expect-error loading file compiled by Vite
import app from "./dist/server/index.mjs";
import type { APIGatewayProxyResult, Handler } from "aws-lambda";
import { Hono } from "hono";
import type { LambdaContext, LambdaEvent } from "hono/aws-lambda";
import { handle } from "hono/aws-lambda";

type Bindings = {
  event: LambdaEvent;
  lambdaContext: LambdaContext;
};

const lambdaApp = new Hono<{ Bindings: Bindings }>();

lambdaApp.route("/", app as Hono);
const awsHandler = handle(lambdaApp);

export const handler: Handler<LambdaEvent, APIGatewayProxyResult> = awsHandler;
/*{ /if }*/
