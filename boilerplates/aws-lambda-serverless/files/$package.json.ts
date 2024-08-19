import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    "aws:deploy": {
      value: "cross-env NODE_ENV=production sls deploy",
      precedence: 20,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [
      "serverless",
      "serverless-cloudfront-invalidate",
      "serverless-esbuild",
      "serverless-s3-sync",
      "serverless-scriptable-plugin",
      "esbuild-plugin-copy",
    ],
    dependencies: [],
  });
}
