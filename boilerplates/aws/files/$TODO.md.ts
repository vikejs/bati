import { loadMarkdown, packageManager, type TransformerProps } from "@batijs/core";

export default async function getTodo(props: TransformerProps) {
  const content = await loadMarkdown(props);
  const pmCmd = packageManager().run;

  //language=Markdown
  const todo = `
## AWS CDK Deployment

Before you get started, make sure to configure your AWS credentials.

**Loading from a file:**

You can keep your AWS credentials in a file. The credentials are found at:

\`~/.aws/credentials\` on Linux, Unix, and macOS;
\`C:\\Users\\USER_NAME\\.aws\\credentials\` on Windows

If the credentials file does not exist on your machine:

Download the AWS CLI from [here](https://aws.amazon.com/cli/) and configure your AWS credentials using the following command:
\`aws configure\`

And then use this guide to configure the credentials
The credentials file should look like:

\`
[default]
aws_access_key_id = <YOUR_ACCESS_KEY_ID>
aws_secret_access_key = <YOUR_SECRET_ACCESS_KEY>
\`

**Loading from environment variables:**

AWS SDK automatically detects AWS credentials in your environment and uses them for making requests to AWS. The environment variables that you need to set are:

\`AWS_ACCESS_KEY_ID\`
\`AWS_SECRET_ACCESS_KEY\`
If you are using temporary credentials, also set:

\`AWS_SESSION_TOKEN\`
This is often the most convenient way to configure credentials when deploying your AWS CDK app in a CI environment. 

> [!NOTE]
> You should change the stack name to give your app stack a distinctive name in your AWS environment. You can do so by modifying the \`infrastructure.ts.ts\` file in the \`cdk/bin\` directory.

### Deployment to AWS

If this is your **first time deploying a CDK app** in this environment you need to **bootstrap**:
\`${pmCmd} cdk bootstrap\`. (The default region based on your AWS CLI configuration will be used)

`;

  content.addMarkdownFeature(todo, "aws");

  return content;
}
