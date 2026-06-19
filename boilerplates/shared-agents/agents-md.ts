import type { VikeMeta } from "@batijs/core/config";
import { categories, type Feature, features } from "@batijs/features";

/**
 * The canonical `AGENTS.md` body (SKILLS_PLAN.md §3/§6.A): the always-loaded project guide —
 * orientation, commands, env, structure — composed from the resolved stack. Kept lean, pointing at
 * `README.md` and upstream docs rather than duplicating volatile detail.
 */
export function buildAgentsMd(meta: VikeMeta, hasEnv: boolean): string {
  const run = meta.BATI.pmRun;
  const sections = [
    `# AGENTS.md

Guidance for AI coding agents working in this repository. This is a [Vike](https://vike.dev) app
scaffolded with [Bati](https://batijs.dev). Match the existing conventions and the stack below.`,
    stackSection(meta),
    `## Commands

- \`${run} dev\` — start the development server
- \`${run} build\` — build for production
- \`${run} preview\` — preview the production build

Use \`${meta.BATI.pm}\` for package management. See \`package.json\` for the full list of scripts.`,
  ];

  if (hasEnv) sections.push(environmentSection(meta));
  sections.push(structureSection(meta));
  sections.push(`## Notes for agents

- Respect the selected stack above; prefer its idioms over introducing new libraries.
- Task-specific how-tos are provided as skills under \`.agents/skills/\` (and \`.claude/skills/\`) — consult them when relevant.
- See \`README.md\` for setup and feature-specific notes.`);
  sections.push(referencesSection(meta));

  return `${sections.join("\n\n")}\n`;
}

/** `llms.txt` docs indexes for the selected stack (Vike is the always-present foundation). */
function referencesSection(meta: VikeMeta): string {
  const refs: string[] = [];
  for (const f of features) {
    const { llms } = f as Feature;
    if (llms && f.category !== "AI Agent" && (f.flag === "vike" || meta.BATI.has(f.flag))) {
      refs.push(`- ${f.label} — ${llms}`);
    }
  }

  return `## References

LLM-friendly docs (\`llms.txt\`) for this stack — fetch these for authoritative, up-to-date API details:

${refs.join("\n")}`;
}

/** Selected features grouped by category (excluding the AI agents themselves), in category order. */
function stackSection(meta: VikeMeta): string {
  const byCategory = new Map<string, string[]>();
  for (const f of features) {
    if (f.category === "AI Agent" || !meta.BATI.has(f.flag)) continue;
    byCategory.set(f.category, [...(byCategory.get(f.category) ?? []), f.label]);
  }

  const lines = categories
    .filter((c) => byCategory.has(c.label))
    .map(
      (c) =>
        `- **${c.label}:** ${
          // biome-ignore lint/style/noNonNullAssertion: byCategory.has(c.label) above
          byCategory.get(c.label)!.join(", ")
        }`,
    );

  return `## Stack\n\n${lines.join("\n")}`;
}

function environmentSection(meta: VikeMeta): string {
  const lines = [
    "- Client/build-time vars use the `PUBLIC_ENV__*` prefix (read via `import.meta.env`); everything else is server-only.",
  ];
  if (meta.BATI.hasDotEnvSecrets) {
    lines.unshift(
      "- Environment variables are configured in `.env` (dev defaults are committed there); keep real secrets out of version control.",
    );
  } else {
    lines.unshift(
      "- Non-secret vars live in `wrangler.jsonc` (`vars`); set secrets with `wrangler secret put <NAME>`. `.env` holds public/dev values only.",
    );
  }
  return `## Environment\n\n${lines.join("\n")}`;
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
    lines.push(
      "- Database access lives in the project's db modules; check the schema/migration files and `package.json`.",
    );
  }
  return `## Project structure\n\n${lines.join("\n")}`;
}
