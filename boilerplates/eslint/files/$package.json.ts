import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    lint: {
      value: "eslint .",
      precedence: 0,
    },
  });

  if (props.meta.BATI.has("prettier")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-prettier", "eslint-config-prettier"],
    });
  }

  if (props.meta.BATI.has("react")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-react", "globals"],
    });
  }

  if (props.meta.BATI.has("vue")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-vue", "vue-eslint-parser"],
    });
  }

  if (props.meta.BATI.has("solid")) {
    addDependency(packageJson, await import("../package.json").then((x) => x.default), {
      devDependencies: ["eslint-plugin-solid", "globals"],
    });
  }

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    devDependencies: ["eslint", "@eslint/js", "typescript-eslint"],
  });
}
