import type { TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const split = props.target.split(/[\\/]/);
  split.pop();
  return {
    name: split.pop(),
    scripts: {
      dev: "vike dev",
      build: "vike build",
      preview: "vike build && vike preview",
    },
    dependencies: {
      vike: "0.4.259",
    },
    devDependencies: {
      typescript: "^6.0.3",
      vite: "^8.0.13",
    },
    type: "module",
  };
}
