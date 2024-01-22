import sdk, { type Project } from "@stackblitz/sdk";

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

export default function Stackblitz(props: { flags: string[] }) {
  return (
    <p
      onclick={() =>
        openProject({
          title: "Bati project",
          description: "Project generate with Bati",
          template: "node",
          files: {
            ".stackblitzrc": STACKBLITZ_RC(props.flags),
          },
        })
      }
    >
      Try in Stackblitz
    </p>
  );
}
