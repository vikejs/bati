import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("aws");
  },
  nextSteps(_meta, _packageManager, { bold }) {
    return [
      {
        type: "text",
        step: `Ensure that AWS credentials are configured. Check ${bold("TODO.md")} for details`,
      },
    ];
  },
  enforce: "post",
  knip: {
    entry: ["entry_aws_lambda.ts", "cdk/lib/vike-stack.ts", "tests/aws_handler.spec.ts"],
    ignore: ["cdk.out/**"],
    ignoreDependencies: ["aws-cdk", "cdk", "esbuild", "npm-run-all2"],
  },
  // Deploy skill (SKILLS_PLAN.md §6.K).
  skills(meta) {
    const pm = meta.BATI.pm;
    const run = pm === "pnpm" || pm === "yarn" ? pm : `${pm} run`;
    return [
      {
        name: "deploy",
        description: "How to deploy this app to AWS Lambda. Use when deploying or configuring the CDK stack.",
        body: `Deploys to AWS Lambda via AWS CDK. The Lambda entry is \`entry_aws_lambda.ts\`; the stack is \`cdk/lib/vike-stack.ts\`.

- **Deploy:** \`${run} deploy:aws\` (builds, then \`cdk deploy --all\`). Ensure AWS credentials are configured.
- **Env vars:** configure them on the Lambda via the CDK stack; locally they're in \`.env\`.

See https://docs.aws.amazon.com/cdk and \`TODO.md\`.`,
      },
    ];
  },
});
