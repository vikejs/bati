import { execSync } from "node:child_process";
import { confirm } from "@inquirer/prompts";
import type { Feature } from "@batijs/features";

const supportedStorybookFrameworks = ["react", "vue", "solid"];

export function getUiFrameworkFlag(
  flags: string[],
  allFeatures: ReadonlyArray<Feature>,
) {
  const uiFrameworkFlags: string[] = allFeatures
    .filter((feature) => feature.category === "UI Framework")
    .map((feature) => feature.flag);
  return flags.find((flag) => uiFrameworkFlags.includes(flag));
}

export function isStorybookFrameworkSupported(uiFramework: string | undefined) {
  return Boolean(
    uiFramework && supportedStorybookFrameworks.includes(uiFramework),
  );
}

export async function initStorybook(
  cwd: string,
  packageManagerExec: string,
  interactive: boolean = true,
): Promise<void> {
  // Prompt user if they want to initialize Storybook
  if (interactive) {
    const confirmed = await confirm({
      message: "Do you want to initialize Storybook now?",
      default: true,
    });

    if (!confirmed) {
      return;
    }
  }

  // Run Storybook init with interactive questionnaire
  const command = `${packageManagerExec} storybook@latest init --no-dev`;
  execSync(command, { cwd, stdio: "inherit" });
}
