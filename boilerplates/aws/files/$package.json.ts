import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("test", {
      value: "vitest",
      precedence: 0,
    })
    .setScript("deploy:cdk-deploy-all", {
      value: "cdk deploy --all",
      precedence: 0,
    })
    .setScript("deploy:aws", {
      value: "run-s build deploy:cdk-deploy-all",
      precedence: 0,
    })
    .setScript("cdk:app", {
      value: "tsx cdk/bin/infrastructure.ts",
      precedence: 0,
    })
    .setScript("cdk", {
      value: "cdk",
      precedence: 0,
    })
    .addDependencies(["aws-cdk-lib", "constructs", "source-map-support"])
    .addDevDependencies(["cdk", "aws-cdk", "@types/node", "@types/which", "typescript", "esbuild", "vitest", "which"])
    .addDevDependencies(["npm-run-all2"], ["deploy:aws"])
    .addDevDependencies(["tsx"], ["cdk:app"]);
}
