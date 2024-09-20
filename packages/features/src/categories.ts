import { categoriesGroups } from "./groups.js";
import type { Category } from "./types.js";

export const categories = [
  {
    label: "Frontend Framework",
    group: categoriesGroups.Frontend,
    description: `Flexible, robust, community-driven, and fast Vite-based frontend framework.`,
    required: true,
  },
  {
    label: "UI Framework",
    group: categoriesGroups.Frontend,
    description: `It’s recommended to choose a frontend lib to kickstart a new Vike project,
as they each come with a wide range of integrations. You can at any time eject and take control over integration code
so that it doesn’t get in your way.`,
    required: true,
  },
  {
    label: "CSS",
    group: categoriesGroups.Frontend,
    description: `These CSS libraries are deeply integrated with UI frameworks.
They showcase their respective recommended usage and how they integrate with Vite and Vike.`,
  },
  {
    label: "UI Component Libraries",
    group: categoriesGroups.Frontend,
    description: `These UI Component Libraries are deeply integrated with UI frameworks.
They showcase their respective recommended usage and how they integrate with Vite and Vike.`,
  },
  {
    label: "Auth",
    group: categoriesGroups.Data,
    description: `Ready to use self-hosted or cloud-based Auth solutions.
Requires to also select a Server of your choosing.`,
  },
  {
    label: "Data fetching",
    group: categoriesGroups.Data,
    description: `Data fetching libraries to help you interact with your backend.
Selecting one of those usually requires you to also choose a Server.`,
  },
  {
    label: "Server",
    group: categoriesGroups.Data,
    description: `Mostly required by other integrations such as Auth or RPC,
it's recommended to only install a Server if you really need to, as Vike doesn't require one to operate.`,
  },
  {
    label: "Database",
    group: categoriesGroups.Data,
    description: `Helping you get started with a database solution.`,
  },
  {
    label: "Hosting",
    group: categoriesGroups.Deployment,
    description: `Quickly host your Vike project with a Serverless or VPS (coming soon) solution.`,
  },
  {
    label: "Linter",
    multiple: true,
    group: categoriesGroups.Utilities,
    description: `Well known linting and formatting tools, pre-configured to match their recommended usage,
tailored for Vike.`,
  },
  {
    label: "Analytics",
    group: categoriesGroups.Utilities,
    description: `Keep track of your website traffic with these ready-to-get-started Analytics solutions.`,
  },
  {
    label: "Error tracking",
    group: categoriesGroups.Utilities,
    description: `Coming soon: Error Tracking solution for frontend and backend`,
  },
] as const satisfies ReadonlyArray<Category>;

export type CategoryLabels = (typeof categories)[number]["label"];
