import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("lint", {
      value: "eslint .",
      precedence: 0,
    })
    .addDevDependencies(["eslint", "@eslint/js", "typescript-eslint"])
    .addDevDependencies(["eslint-plugin-prettier", "eslint-config-prettier"], props.meta.BATI.has("prettier"))
    .addDevDependencies(["eslint-plugin-react", "globals"], props.meta.BATI.has("react"))
    .addDevDependencies(["eslint-plugin-vue", "vue-eslint-parser"], props.meta.BATI.has("vue"))
    .addDevDependencies(["eslint-plugin-solid", "globals"], props.meta.BATI.has("solid"));
}
