export default function getTsConfig() {
  let content: Record<string, any> = {
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
    content = { ...content, jsx: "react" };
  } else if (import.meta.VIKE_FRAMEWORK === "solid") {
    content = { ...content, jsx: "preserve", jsxImportSource: "solid-js" };
  }

  return content;
}
