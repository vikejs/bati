import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const pkgjson = await import("../package.json").then((x) => x.default);
  // TODO remove when shadcn supports tailwind v4
  if (props.meta.BATI.has("shadcn-ui")) {
    pkgjson.devDependencies.tailwindcss = "^3.4.17";
  }
  const packageJson = await loadPackageJson(props, pkgjson);

  return (
    packageJson
      .addDevDependencies(["tailwindcss"])
      // TODO IDEM
      .addDevDependencies(["@tailwindcss/vite"], !props.meta.BATI.has("shadcn-ui"))
      .addDevDependencies(["daisyui"], props.meta.BATI.has("daisyui"))
  );
}
