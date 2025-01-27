import sdk, { type Project } from "@stackblitz/sdk";
import clsx from "clsx";

const STACKBLITZ_RC = (args: string[]) => `{
  "installDependencies": false,
  "startCommand": "pnpm create bati ${args.join(" ")} --force . && pnpm i && pnpm run dev",
  "env": {
    "NODE_ENV": "development"
  }
}`;

function openProject(project: Project) {
  sdk.openProject(project, {});
}

function StackblitzLogo(props: { class?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 368" class={props.class}>
      <path fill="#49A2F8" d="M109.586 217.013H0L200.34 0l-53.926 150.233H256L55.645 367.246l53.927-150.233z" />
    </svg>
  );
}

export default function Stackblitz(props: { class?: string; flags: string[] }) {
  // tooltip and data-tip are dynamically added in JS
  return (
    <button
      id="stackblitz-cta"
      class={clsx("tooltip-bottom tooltip-warning left-[1px] btn btn-sm hover:btn-ghost group h-auto", props.class)}
      onclick={() =>
        openProject({
          title: "Bati project",
          description: "Project generated with Bati",
          template: "node",
          files: {
            ".stackblitzrc": STACKBLITZ_RC(props.flags),
            "README.md": `Waiting for Bati CLI to finish. This file will automatically refresh when the project is ready`,
          },
        })
      }
    >
      <StackblitzLogo class="h-6" />
      <span class="text-nowrap overflow-hidden inline-block font-bold">Try me in Stackblitz</span>
    </button>
  );
}
