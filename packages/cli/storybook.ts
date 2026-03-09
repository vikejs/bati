import { execSync } from "node:child_process";
import { confirm } from "@inquirer/prompts";
import type { Feature } from "@batijs/features";
import { red } from "colorette";
import type { Integration } from "./types.js";

const supportedStorybookFrameworks = ["react", "vue", "solid"];

export function getUiFrameworkFlag(flags: string[], allFeatures: ReadonlyArray<Feature>) {
  const uiFrameworkFlags: string[] = allFeatures
    .filter((feature) => feature.category === "UI Framework")
    .map((feature) => feature.flag);
  return flags.find((flag) => uiFrameworkFlags.includes(flag));
}

export function isStorybookFrameworkSupported(uiFramework: string | undefined) {
  return Boolean(uiFramework && supportedStorybookFrameworks.includes(uiFramework));
}

export async function initStorybook(
  cwd: string,
  packageManagerExec: string,
  interactive: boolean = true,
): Promise<boolean> {
  let shouldUseDefaultConfig = !interactive;

  // Prompt user if they want to initialize Storybook
  if (interactive) {
    shouldUseDefaultConfig = await confirm({
      message: "Use default Storybook configuration?",
      default: true,
    });
  }

  // Run Storybook init with interactive questionnaire
  const command = `${packageManagerExec} storybook@latest init --no-dev${shouldUseDefaultConfig ? " --yes" : ""}`;
  execSync(command, { cwd, stdio: "inherit" });
  return true;
}

export const storybookIntegration: Integration = {
  flag: "storybook",
  label: "Storybook",
  arg: {
    type: "boolean",
    description: "If true, initializes Storybook in the generated app (React, Vue, Solid only)",
    required: false,
  },
  async run({ project, flags, allFeatures, packageManagerExec }) {
    const uiFramework = getUiFrameworkFlag(flags, allFeatures);

    if (!isStorybookFrameworkSupported(uiFramework)) {
      console.error(`${red("⚠")} The \`--storybook\` flag is currently supported only with React, Vue, or Solid.`);
      process.exit(6);
    }

    return await initStorybook(project, packageManagerExec);
  },
  nextSteps(packageManagerRun) {
    return [{ type: "command", step: `${packageManagerRun} storybook` }];
  },
};
