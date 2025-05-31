import { loadYaml, type TransformerProps } from "@batijs/core";

const dependenciesApproveBuild = ["@biomejs/biome", "@sentry/cli", "@tailwindcss/oxide", "better-sqlite3", "esbuild"];

function intersect<T>(a: T[], b: T[]) {
  return a.filter((x) => b.includes(x));
}

export default async function getPnpmWorkspace(props: TransformerProps) {
  const deps = [
    ...Object.keys(props.packageJson.dependencies ?? {}),
    ...Object.keys(props.packageJson.devDependencies ?? {}),
  ];
  const intersection = intersect(dependenciesApproveBuild, deps);
  if (intersection.length === 0) return;

  const pnpmWorkspace = await loadYaml(props, { fallbackEmpty: true });

  if (!pnpmWorkspace.has("onlyBuiltDependencies")) {
    pnpmWorkspace.set("onlyBuiltDependencies", []);
  }

  for (const pack of intersection) {
    pnpmWorkspace.addIn(["onlyBuiltDependencies"], pack);
  }

  return pnpmWorkspace;
}
