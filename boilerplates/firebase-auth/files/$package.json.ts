import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@types/cookie"],
    dependencies: ["firebase", "firebase-admin", "firebaseui", "cookie", "@universal-middleware/core", "dotenv"],
  });
}
