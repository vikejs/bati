export default function getTsConfig() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: Record<string, any> = {
    compilerOptions: {
      strict: true,
      allowJs: true,
      checkJs: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      skipLibCheck: true,
      sourceMap: true,
      module: "ESNext",
      moduleResolution: "Node",
      target: "ES2020",
      lib: ["DOM", "DOM.Iterable", "ESNext"],
      types: ["vite/client"],
    },
  };

  if (import.meta.VIKE_FRAMEWORK === "react") {
    content.compilerOptions.jsx = "react";
  } else if (import.meta.VIKE_FRAMEWORK === "solid") {
    content.compilerOptions.jsx = "preserve";
    content.compilerOptions.jsxImportSource = "solid-js";
    content.compilerOptions.types = ["solide/types"];
  }

  return content;
}
