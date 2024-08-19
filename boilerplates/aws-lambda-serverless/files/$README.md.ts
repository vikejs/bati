import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const docs = `
  ## AWS Lambda Serverless Framework

  The deployment requires an default AWS profile to be [set up](https://www.serverless.com/framework/docs/providers/aws/guide/credentials) on your local machine.

  ### Setup

  1. Change the project name (custom.project) in the \`serverless.yml\` file. **This is required to create a worldwide unique S3 bucket!**.

  ### Deploy

  \`pnpm aws:deploy\`

  The url of the CloudFront distribution is printed with \`pnpm sls info --verbose\` - see \`CloudFrontDistributionUrl: \`.

  ### Remove

  \`pnpm sls remove\`

  ### Logs

  \`pnpm sls logs -f vikeapp\`

  ### Resources

  The following resources are created:
  * S3 bucket for the static files (only \`dist/client/assets\` is uploaded!)
  * CloudFront distribution for the static files and the Lambda function
  * Lambda function with the Node.js runtime and the entry file \`hono-entry_aws_lambda.ts\`
  
  `;

  content.addTodo(docs);

  return content.finalize();
}
