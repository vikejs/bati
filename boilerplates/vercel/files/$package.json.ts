import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      // vite preview does not make sense when targetting Vercel
      .removeScript("prod")
      .addDependencies(["@photonjs/vercel"])
  );
}
