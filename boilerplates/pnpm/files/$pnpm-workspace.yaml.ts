import { loadYaml, type TransformerProps, YAMLMap } from "@batijs/core";

const dependenciesApproveBuild: Record<string, boolean | string[]> = {
  "@biomejs/biome": true,
  "@sentry/cli": true,
  "@tailwindcss/oxide": true,
  "better-sqlite3": true,
  esbuild: true,
  sharp: true,
  workerd: true,
  tsx: ["esbuild"],
};

function intersect<T>(a: T[], b: T[]) {
  return a.filter((x) => b.includes(x));
}

export default async function getPnpmWorkspace(props: TransformerProps): Promise<unknown> {
  const deps = [
    ...Object.keys(props.packageJson.dependencies ?? {}),
    ...Object.keys(props.packageJson.devDependencies ?? {}),
  ];
  const intersection = intersect(Object.keys(dependenciesApproveBuild), deps);
  if (intersection.length === 0) return;

  const pnpmWorkspace = await loadYaml(props, { fallbackEmpty: true });
  let allowBuilds = pnpmWorkspace.get("allowBuilds", true) as YAMLMap | undefined;

  if (!allowBuilds) {
    allowBuilds = new YAMLMap();
    pnpmWorkspace.set("allowBuilds", allowBuilds);
  }

  for (const pack of intersection) {
    if (dependenciesApproveBuild[pack] === true) {
      allowBuilds.set(pack, true);
    } else if (Array.isArray(dependenciesApproveBuild[pack])) {
      for (const pack2 of dependenciesApproveBuild[pack]) {
        allowBuilds.set(pack2, true);
      }
    }
  }

  return pnpmWorkspace;
}
