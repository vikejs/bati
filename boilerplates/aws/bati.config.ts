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
});
