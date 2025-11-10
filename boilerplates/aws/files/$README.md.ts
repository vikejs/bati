import { loadMarkdown, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadMarkdown(props);

  //language=Markdown
  const about = `
## *AWS CDK Deployment*

This is a boilerplate for deploying your Vike app to AWS using the AWS Cloud Development Kit (CDK) including creating a custom domain in Route53.

**Architecture:**
- S3 Bucket for static client assets (\`/dist/client/assets\`).
- Lambda function for the backend and SSR.
- CloudFront distribution for CDN and routing requests \`/assets/*\` to the S3 bucket.

This boilerplate is a starting point for deploying your Vike app to AWS. You can customize the deployment by modifying the \`cdk/lib/vike-stack.ts\` file.

### Deployment to AWS

If you want to have a look at the synthesized CloudFormation template, you can run \`pnpm cdk synth\` and see the template as YAML on screen or in \`cdk.out/VikeStack.template.json\`.

> [!NOTE]
> If this is your **first time deploying a CDK app** in this environment you need to **bootstrap**:
> \`pnpm cdk bootstrap\`. (The default region based on your AWS CLI configuration will be used)

You can deploy your Vike App via the following command:
\`pnpm deploy:aws\` or \`pnpm cdk deploy\`

The URL to the CloudFront distribution will be displayed in the output of the deployment.
You can also access the CloudFront distribution domainname in the AWS SSM registry und \`vike/distribution/url\`.

### Stack Configuration

You can configure the stack in the \`cdk/bin/infrastructure.ts\` file:

| Variable | Examples | Description |
| --- | --- | --- |
| \`domainName: "example.com",\` | "example.com" |  |
| \`subDomain: "www",\` |"www" | |
| \`certificate: undefined,\` | "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012" or a certificatemanager.ICertificate | reuse an existing AWS Certificate |
| \`hostedZone: undefined,\` | route53.HostedZone.fromLookup(stack, "MyHostedZone", { domainName: "example.com" }) | |

If \`domainName\` is managed by **Route53**, the \`hostedZone\` will be updated with by lookup in Route53 based on the \`domainName\`.

These scenarios are supported:
A. \`domainName\` exists in Route53, \`subDomain\` is given - the subdomain with the domain are used as alternative domains for the CloudFront Distribution. An new Certificate for the url is created and assigned to the CF-Distribution. An Alias-Record pointing to the CF-Distribution ist created in Route53.
B. \`domainName\` exists in Route53, \`subDomain\` is given - the subdomain with the domain are used as alternative domains for the CloudFront Distribution. If \`certificate\` contains a valid entry it will be assigned to the CF-Distribution. An Alias-Record pointing to the CF-Distribution ist created in Route53.
C. \`domainName\` **does not exist** in Route53, \`subDomain\` is given - the subdomain with the domain are used as alternative domains for the CloudFront Distribution. If \`certificate\` contains a valid entry it will be assigned to the CF-Distribution. A manual created CNAME or A-Record should pointing to the CF-Distribution.

#### Custom Domain

If you have a custom domain, you can add it to the stack configuration in the \`cdk/bin/infrastructure.ts\` file:

> [!NOTE]
> If you deploy your App to a region different than \`us-east-1\` and you have never deployed to this region before, you will need to bootstrap this region too:
 \`CDK_DEFAULT_REGION=us-east-1 pnpm deploy:cdk bootstrap\`


### Destroying the Stack on AWS

To destroy the stack on AWS, run the following command:
\`pnpm cdk destroy\`

Or delete the CloudFormation stack which starts with "VikeStack-<Your App Name>" created by this project.
`;

  content.addMarkdownFeature(about, "aws");

  return content;
}
