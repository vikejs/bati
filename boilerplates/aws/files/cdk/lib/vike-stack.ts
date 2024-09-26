#!/usr/bin/env node
import "source-map-support/register";
import { Construct } from "constructs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as origin from "aws-cdk-lib/aws-cloudfront-origins";
import * as api from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { existsSync } from "node:fs";
import type { CustomStackProps } from "../bin/infrastructure";

type VikeStackProps = cdk.StackProps & {
  customStackProps: CustomStackProps;
};

// Define __dirname for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");

export class VikeStack extends cdk.Stack {
  readonly distributionUrlParameterName = `/${this.stackName}/distribution/url`;

  constructor(scope: Construct, id: string, props: VikeStackProps) {
    super(scope, id, props);

    const certificate =
      props.customStackProps?.certificate && typeof props.customStackProps?.certificate !== "string"
        ? props.customStackProps?.certificate
        : undefined;

    const hostedZone = props.customStackProps?.hostedZone;
    const subDomain = props.customStackProps?.subDomain;
    const domainName = props.customStackProps?.domainName;
    const siteDomainName = domainName
      ? `${(subDomain?.length ?? 0 > 0) ? `${subDomain}.` : ""}${domainName}`
      : undefined;

    const bucket = new s3.Bucket(this, "StaticAssetsBucket", {
      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code

      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      autoDeleteObjects: true, // NOT recommended for production code
    });

    // Create a Lambda function for the backend
    const banner =
      "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);";

    const fn = new nodejs.NodejsFunction(this, "RequestHandler", {
      handler: "handler",
      entry: join(__dirname, "../../entry_aws_lambda.ts"),
      // fix error: "Cannot find a package lock file ..." when using "bun" javascript package manager and runtime
      depsLockFilePath: findBunLockFile(),
      environment: {
        NODE_ENV: "production",
      },
      bundling: {
        banner,
        format: nodejs.OutputFormat.ESM,
        minify: true,
        target: "esnext",
        //nodeModules: ["react", "react-dom"],
        esbuildArgs: {
          "--tree-shaking": true,
        },
      },
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(10),
      logRetention: logs.RetentionDays.THREE_DAYS,
      tracing: lambda.Tracing.ACTIVE,
    });

    const integration = new HttpLambdaIntegration("RequestHandlerIntegration", fn, {
      payloadFormatVersion: api.PayloadFormatVersion.VERSION_2_0,
    });

    const httpApi = new api.HttpApi(this, "WebsiteApi", {
      defaultIntegration: integration,
    });

    const httpApiUrl = `${httpApi.httpApiId}.execute-api.${cdk.Stack.of(this).region}.${cdk.Stack.of(this).urlSuffix}`;

    // Create a CloudFront distribution with custom behaviors
    const requestHandlerOrigin = new origin.HttpOrigin(httpApiUrl);

    const requestHandlerBehavior: cloudfront.AddBehaviorOptions = {
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      compress: true,
    };

    const assetOrigin = origin.S3BucketOrigin.withOriginAccessControl(bucket);
    const assetBehaviorOptions = {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      compress: true,
    };

    const distribution = new cloudfront.Distribution(this, "CloudFront", {
      defaultBehavior: {
        origin: requestHandlerOrigin,
        ...requestHandlerBehavior,
      },
      domainNames: siteDomainName ? [siteDomainName] : undefined,
      certificate,
      enableIpv6: true,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    distribution.addBehavior("/assets/*", assetOrigin, assetBehaviorOptions);

    // Deploy static assets to the S3 bucket and invalidate the CloudFront cache
    new s3deploy.BucketDeployment(this, "DeployStaticAssets", {
      sources: [s3deploy.Source.asset(join(__dirname, "../../dist/client"))],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
      prune: true,
      cacheControl: [
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.sMaxAge(cdk.Duration.days(365)),
      ],
    });

    // Create a Route 53 alias record pointing to the CloudFront distribution
    if (hostedZone) {
      new route53.ARecord(this, "AliasRecord", {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
        recordName: subDomain ?? "", // This will create a record for www.example.com
      });
    }

    // Store the CloudFront URL in an SSM parameter
    new ssm.StringParameter(this, "DistributionUrlParameter", {
      parameterName: this.distributionUrlParameterName,
      stringValue: siteDomainName ? siteDomainName! : distribution.distributionDomainName,
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output the CloudFront URL and API endpoint
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${siteDomainName ? siteDomainName : distribution.distributionDomainName}`,
    });

    new cdk.CfnOutput(this, "CloudFrontID", {
      value: distribution.distributionId,
    });
  }
}

function findBunLockFile() {
  let bunLockFile = join(__dirname, "../../", "bun.lockb");
  if (existsSync(bunLockFile)) {
    return bunLockFile;
  }
  bunLockFile = join(__dirname, "../../", "../../", "bun.lockb"); // special case for bat tests
  if (existsSync(bunLockFile)) {
    return bunLockFile;
  }
  return undefined;
}
