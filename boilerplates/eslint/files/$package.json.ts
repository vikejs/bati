import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return (
    packageJson
      .setScript("lint", {
        value: "eslint .",
        precedence: 0,
      })
      // jiti is required for eslint 9 to load the TypeScript flat config (eslint.config.ts).
      // Without it in the app's own node_modules the lint step fails on standalone installs
      // (CI), even though it appears to work where a parent workspace happens to hoist jiti.
      .addDevDependencies(["eslint", "@eslint/js", "typescript-eslint", "globals", "jiti"])
      .addDevDependencies(["eslint-plugin-prettier", "eslint-config-prettier"], props.meta.BATI.has("prettier"))
      .addDevDependencies(["eslint-plugin-vue", "vue-eslint-parser"], props.meta.BATI.has("vue"))
      .addDevDependencies(["eslint-plugin-react"], props.meta.BATI.has("react"))
      .addDevDependencies(["eslint-plugin-solid"], props.meta.BATI.has("solid"))
  );
}
