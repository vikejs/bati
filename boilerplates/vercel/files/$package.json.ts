import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      // vite preview does not make sense when targeting Vercel
      .removeScript("prod")
      .addDependencies(["vite-plugin-vercel"])
  );
}
