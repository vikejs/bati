/**
 * Generator for the canonical `AGENTS.md` body (SKILLS_PLAN.md §3, §6.A).
 *
 * This is the always-loaded project guide an agent reads every session: orientation, dev commands,
 * structure, and a pointer to the deeper skills. It is composed centrally from the resolved
 * `BatiSet` and stays deliberately lean — pointing at `README.md` and upstream docs rather than
 * duplicating volatile detail, to keep it cheap for an AI to maintain (§10).
 */
import { categories, features } from "@batijs/features";
import type { VikeMeta } from "./types.js";

export function buildAgentsMd(meta: VikeMeta, pmRun: string): string {
  const sections: string[] = [
    `# AGENTS.md

Guidance for AI coding agents working in this repository. This is a [Vike](https://vike.dev) app
scaffolded with [Bati](https://batijs.dev). Match the existing conventions and the stack below.`,
    stackSection(meta),
    `## Commands

- \`${pmRun} dev\` — start the development server
- \`${pmRun} build\` — build for production
- \`${pmRun} preview\` — preview the production build

Use \`${meta.BATI.pm}\` for package management. See \`package.json\` for the full list of scripts.`,
    structureSection(meta),
    `## Notes for agents

- Respect the selected stack above; prefer its idioms over introducing new libraries.
- Task-specific how-tos are provided as skills under \`.agents/skills/\` (and \`.claude/skills/\`) — consult them when relevant.
- See \`README.md\` for setup and feature-specific notes.`,
  ];

  return `${sections.join("\n\n")}\n`;
}

/** Selected features grouped by category (excluding the AI agents themselves), in category order. */
function stackSection(meta: VikeMeta): string {
  const byCategory = new Map<string, string[]>();
  for (const f of features) {
    if (f.category === "AI Agent") continue;
    if (!meta.BATI.has(f.flag)) continue;
    const list = byCategory.get(f.category) ?? [];
    list.push(f.label);
    byCategory.set(f.category, list);
  }

  const lines: string[] = [];
  for (const category of categories) {
    const labels = byCategory.get(category.label);
    if (labels && labels.length > 0) {
      lines.push(`- **${category.label}:** ${labels.join(", ")}`);
    }
  }

  return `## Stack\n\n${lines.join("\n")}`;
}

function structureSection(meta: VikeMeta): string {
  const lines = [
    "- `pages/` — file-based routing. A route is a directory with a `+Page` file; add `+route`, `+data`, `+config`, `+guard`, or `+Layout` files beside it. See https://vike.dev.",
    "- `+config.ts` — Vike configuration (global under `pages/`, or per-route).",
  ];
  if (meta.BATI.hasServer) {
    lines.push("- The app runs behind a server; the server entry boots Vike (see the `dev` script in `package.json`).");
  }
  if (meta.BATI.hasDatabase || meta.BATI.hasOrm) {
    lines.push("- Database access lives in the project's db modules; check the schema/migration files and `package.json`.");
  }
  return `## Project structure\n\n${lines.join("\n")}`;
}
