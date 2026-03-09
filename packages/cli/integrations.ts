import { storybookIntegration } from "./storybook.js";
import type { BatiArgDef, Integration, IntegrationContext } from "./types.js";

export const integrations: ReadonlyArray<Integration> = [storybookIntegration];

function isEnabled(args: Record<string, unknown>, flag: string): boolean {
  return args[flag] === true;
}

export function getIntegrationArgDefs(): Record<string, BatiArgDef> {
  return Object.fromEntries(
    integrations.map((integration) => [integration.flag, integration.arg]),
  );
}

export function getEnabledIntegrations(
  args: Record<string, unknown>,
): Integration[] {
  return integrations.filter((integration) =>
    isEnabled(args, integration.flag),
  );
}

export async function runEnabledIntegrations(
  enabledIntegrations: ReadonlyArray<Integration>,
  context: IntegrationContext,
): Promise<Integration[]> {
  const appliedIntegrations: Integration[] = [];

  for (const integration of enabledIntegrations) {
    const wasApplied = await integration.run(context);
    if (wasApplied === false) {
      continue;
    }

    appliedIntegrations.push(integration);
  }

  return appliedIntegrations;
}
