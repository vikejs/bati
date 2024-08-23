import { loadReadme, type TransformerProps } from "@batijs/core";

export default async function getReadme(props: TransformerProps) {
  const content = await loadReadme(props);

  //language=Markdown
  const docs =
    `
  ## AWS Lambda Serverless Framework

  The deployment requires a default AWS profile to be [set up](https://www.serverless.com/framework/docs/providers/aws/guide/credentials) on your local machine.
  To stay within the limit of an AWS Lambda deployment (max. 50MB), all external dependencies are bundled with esbuild and static assets only used by the client \`dist/client/assets\` are uploaded to S3.

  ### Setup

  1. Change the project name (custom.project) in the \`serverless.yml\` file. **This is required to create a worldwide unique S3 bucket!**.
  2. Stage can be changed in the \`serverless.yml\` file or by adding the option \`--stage prod\`.
  3. The region can be changed in the \`serverless.yml\` .

  ### Deploy

  \`pnpm deploy:aws\`

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
  * Default Stage: dev

  ### Static Assets in Lambda

  The static assets are served by the Lambda function. The path is defined in the \`hono-entry_aws_lambda.ts\` file.
  
  If you need to access any static assets in your server code which are not public, you can use one of the following methods:
  1) Use \`import data from './data.json'\` in the Lambda function. This will embed the data in the Lambda function.
  2) Use \`import data from './data.docx' assert { type: 'docx' }\` in the Lambda function and add the [copy loader](https://esbuild.github.io/content-types/#copy) to \`esbuild.config.cjs\`.
  3) Uncomment the \`copyPlugin\` in \`esbuild-plugins.cjs\`, adapt the configuration to the location of your data folder.
     
     **Example Code:**
     \`\`\`typescript
     // code snipplet from server/create-todo-handler.ts and server/data/users.bin
     const pp = path.join(path.dirname(fileURLToPath(import.meta.url)), "data/users.bin");
     console.log(pp);
     const usersData = fs.readFileSync(pp, "utf-8");
     const users = JSON.parse(usersData);
     \`\`\`

     **Example Configuration:**
     \`\`\`js
     const copyPlugin = copy({
       assets: [{
          from: ['./server/data/*'],
          to: ['data']
       }]
     })
     \`\`\`

  ### Troubleshooting

  * If the deployed app is not working, check the Lambda function logs \`pnpm sls logs -f vikeapp\`. 
    * If the error is \`Cannot find server entry.\` redeploy your app and try again.

  ` +
    (props.meta.BATI.has("sentry")
      ? `
  ### Sentry

  [Sentry is integrated](https://docs.sentry.io/platforms/javascript/guides/aws-lambda/install/esm-npm/) in the Lambda function. 
  The build process will automatically upload the source maps to Sentry.
  
  ### Configuration
  
  The environment variable \`SENTRY_DSN\` and some other sentry variables must be set in\`.env\`.
  Any further configuration can be done in the \`sentry.config.server.mjs\` file.
`
      : "");

  content.addTodo(docs);

  return content.finalize();
}
