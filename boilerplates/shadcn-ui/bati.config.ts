import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("shadcn-ui");
  },
  // UI component library skill (SKILLS_PLAN.md §6.E).
  skills(meta) {
    const exec = meta.BATI.pmDlx;
    return [
      {
        name: "shadcn-ui",
        description:
          "How to use shadcn/ui in this app. Use when adding a shadcn/ui component or working with its styling.",
        body: `shadcn/ui on Tailwind — components are copied into your project (you own them). \`components.json\` holds the config and the \`cn()\` class-merge helper is in \`lib/utils.ts\`.

- **Add a component:** \`${exec} shadcn@latest add <name>\` (e.g. \`button\`); it's written under the components path configured in \`components.json\`.
- **Use it:** import from that components path and compose classes with \`cn()\`.
- Styling is Tailwind-based (see the \`styling\` skill).

See https://ui.shadcn.com.`,
      },
    ];
  },
});
