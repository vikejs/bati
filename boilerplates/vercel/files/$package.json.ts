import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      // vite preview does not make sense when targeting Vercel
      .removeScript("prod")
      // FIXME required because of @universal-middleware/vercel barrel import of all servers
      .addDevDependencies(["h3"])
      .addDependencies(["@photonjs/vercel"])
  );
}
