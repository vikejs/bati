import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .addDevDependencies(["@types/cookie"])
    .addDependencies(["firebase", "firebase-admin", "firebaseui", "cookie", "@universal-middleware/core", "dotenv"]);
}
