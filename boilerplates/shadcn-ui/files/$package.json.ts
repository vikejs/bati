import { addDependency, loadAsJson, setScripts, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps) {
  const packageJson = await loadAsJson(props);

  setScripts(packageJson, {
    // @ts-ignore
    shadcn: {
      value: "pnpm dlx shadcn@latest",
      precedence: 20,
      warnIfReplaced: true,
    },
  });

  return addDependency(packageJson, await import("../package.json").then((x) => x.default), {
    dependencies: [
      "tailwindcss-animate",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "lucide-react",
      "@radix-ui/react-icons",
    ],
  });
}
