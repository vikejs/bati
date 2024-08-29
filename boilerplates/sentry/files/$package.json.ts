import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  const noFramework = !(props.meta.BATI.has("react") || props.meta.BATI.has("vue") || props.meta.BATI.has("solid"));
  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [...(props.meta.BATI.has("sentry") ? (["@sentry/vite-plugin", "dotenv"] as const) : [])],
    dependencies: [
      ...(noFramework ? (["@sentry/browser"] as const) : []),
      ...(props.meta.BATI.has("react") ? (["@sentry/react"] as const) : []),
      ...(props.meta.BATI.has("solid") ? (["@sentry/solid"] as const) : []),
      ...(props.meta.BATI.has("vue") ? (["@sentry/vue"] as const) : []),
    ],
  });
}
