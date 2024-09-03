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
    "deploy:aws": {
      value: "pnpm run build && cdk deploy --all",
      precedence: 0,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [
      "cdk",
      "aws-cdk",
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
