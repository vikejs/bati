import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has("tailwindcss");
  },
  knip: {
    // daisyui is included here because daisyui dependsOn tailwindcss,
    // so this config is always active when daisyui is used
    ignoreDependencies: ["tailwindcss", "daisyui"],
  },
  // Styling skill (SKILLS_PLAN.md §6.D).
  skills(meta) {
    const daisy = meta.BATI.has("daisyui");
    const daisyNote = daisy
      ? "- **daisyUI** component classes are available via the Tailwind plugin (see the `daisyui` skill).\n"
      : "";
    const skills = [
      {
        name: "styling",
        description:
          "How styling works in this app (Tailwind CSS v4). Use when styling a component, adding global styles, or customizing the theme.",
        body: `Tailwind CSS v4 — CSS-first config (no \`tailwind.config.js\`). The global stylesheet is \`pages/tailwind.css\` (\`@import "tailwindcss"\`), imported from \`pages/+Layout.*\`. The \`@tailwindcss/vite\` plugin is already configured.

- **Style components:** use utility classes directly in markup (\`class\` / \`className\`).
- **Theme + base styles:** customize via \`@theme\` and \`@layer base { ... @apply ... }\` in \`pages/tailwind.css\`.
${daisyNote}- **New global CSS:** add it to \`pages/tailwind.css\`.

See https://tailwindcss.com/docs.`,
      },
    ];
    if (daisy) {
      skills.push({
        name: "daisyui",
        description: "How to use daisyUI in this app. Use when adding daisyUI components or themes.",
        body: `daisyUI is enabled as a Tailwind plugin (\`@plugin "daisyui"\` in \`pages/tailwind.css\`).

- **Use a component:** apply daisyUI class names in markup (e.g. \`class="btn btn-primary"\`, \`card\`, \`modal\`).
- **Themes:** configure themes via the plugin in \`pages/tailwind.css\`; switch with \`data-theme\` on an element.

See https://daisyui.com.`,
      });
    }
    return skills;
  },
});
