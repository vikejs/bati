import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    lint: {
      value: "biome lint --apply .",
      precedence: 0,
    },
    format: {
      value: "biome format --write .",
      precedence: 0,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["@biomejs/biome"],
  });
}
