import { loadYaml, type TransformerProps } from "@batijs/core";

export default async function getPnpmWorkspace(props: TransformerProps): Promise<unknown> {
  const pnpmWorkspace = await loadYaml(props, { fallbackEmpty: true });

  // Let pnpm run the build scripts of all dependencies, so installs never hang on
  // interactive approval or silently skip required postinstall steps.
  // https://pnpm.io/settings/build#dangerouslyallowallbuilds
  pnpmWorkspace.set("dangerouslyAllowAllBuilds", true);

  return pnpmWorkspace;
}
