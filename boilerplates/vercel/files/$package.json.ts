import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("prod", {
      value: "vike build && vite preview",
      precedence: 25,
      warnIfReplaced: true,
    })
    .addDependencies(["vite-plugin-vercel"]);
}
