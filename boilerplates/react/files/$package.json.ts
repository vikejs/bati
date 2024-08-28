import { addDependency, loadAsJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: [
      "vite",
      "@types/react",
      "@types/react-dom",
      ...(props.meta.BATI.has("sentry") ? (["@sentry/vite-plugin", "dotenv"] as const) : []),
    ],
    dependencies: [
      "@vitejs/plugin-react",
      "cross-fetch",
      "react",
      "react-dom",
      "vike",
      "vike-react",
      ...(props.meta.BATI.has("sentry") ? (["@sentry/react"] as const) : []),
    ],
  });
}
