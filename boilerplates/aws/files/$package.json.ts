import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    test: {
      value: "vitest",
      precedence: 0,
    },
    "deploy:cdk": {
      value: "cdk",
      precedence: 0,
    },
    "deploy:cdk-deploy-all": {
      value: "cdk deploy --all",
      precedence: 0,
    },
    "deploy:aws": {
      value: "run-s build deploy:cdk-deploy-all",
      precedence: 0,
    },
    // @ts-ignore
    "cdk:app": {
      value: "tsx cdk/bin/infrastructure.ts",
      precedence: 0,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [
      "cdk",
      "aws-cdk",
      "npm-run-all2",
      "@types/node",
      "tsx",
      "typescript",
      "esbuild",
      "vitest",
      "which",
      "@types/which",
    ],
    dependencies: ["aws-cdk-lib", "constructs", "source-map-support"],
  });
}
