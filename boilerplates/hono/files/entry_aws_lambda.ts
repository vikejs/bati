// $$.keepFileIf($$.BATI.has("aws"))
/*
entry_aws_lambda.ts

This file is the entry point for AWS Lambda

Notes:
* The file name must not have any special characters or dots except for the extension. https://docs.aws.amazon.com/lambda/latest/api/API_CreateFunction.html#API_CreateFunction_RequestSyntax

*/
import type { Handler } from "aws-lambda";
import type { Hono } from "hono";
import { handle } from "hono/aws-lambda";
// @ts-expect-error loading file compiled by Vite
import { app } from "./dist/server/aws.mjs";

// Serve the app that vike(app) was called on: mounting it into another app with app.route() breaks vike(app)
export const handler: Handler = handle(app as Hono);
