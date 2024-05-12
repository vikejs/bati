import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    lint: {
      value: "eslint --ext .js,.jsx,.ts,.tsx .",
      precedence: 0,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["eslint", "@typescript-eslint/parser", "@typescript-eslint/eslint-plugin"],
  });
}
