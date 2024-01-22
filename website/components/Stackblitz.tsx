import sdk, { type Project } from "@stackblitz/sdk";
import clsx from "clsx";

const STACKBLITZ_RC = (args: string[]) => `
{
  "installDependencies": false,
  "startCommand": "pnpm create @batijs/app ${args.join(" ")} --force . && pnpm i && pnpm run dev",
  "env": {
    "NODE_ENV": "development"
  }
}
`;

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
  return (
    <button
      class={clsx("btn btn-sm btn-ghost group h-auto gap-0 hover:gap-2 transition-all", props.class)}
      onclick={() =>
        openProject({
          title: "Bati project",
          description: "Project generated with Bati",
          template: "node",
          files: {
            ".stackblitzrc": STACKBLITZ_RC(props.flags),
          },
        })
      }
    >
      <StackblitzLogo class="h-6" />
      <span class="max-w-0 text-nowrap overflow-hidden inline-block transition-all duration-500 group-hover:max-w-32">
        Try me in Stackblitz
      </span>
    </button>
  );
}
