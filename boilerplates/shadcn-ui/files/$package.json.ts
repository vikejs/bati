import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("shadcn", {
      value: "npx shadcn@latest",
      precedence: 1,
      warnIfReplaced: true,
    })
    .addDependencies([
      "tailwindcss-animate",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "@radix-ui/react-icons",
    ]);
}
