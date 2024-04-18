import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    lint: {
      value: "eslint --ext .js,.jsx,.ts,.tsx .",
      precedence: 0,
    },
  });

  if (props.meta.BATI.has("prettier")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-prettier"],
    });
  }

  if (props.meta.BATI.has("react")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-react"],
    });
  }

  if (props.meta.BATI.has("vue")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-vue", "vue-eslint-parser"],
    });
  }

  if (props.meta.BATI.has("solid")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-solid"],
    });
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["eslint", "@eslint/js", "typescript-eslint"],
  });
}
