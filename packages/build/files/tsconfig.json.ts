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

  if (["react"].includes(import.meta.VIKE_FRAMEWORK!)) {
    content = { ...content, jsx: "react" };
  }

  if (import.meta.VIKE_FRAMEWORK === "react") {
    console.log("REACT!");
  }

  if (import.meta.VIKE_FRAMEWORK === "solid") {
    console.log("SOLID!");
  }

  if (import.meta.VIKE_FRAMEWORK !== "react") {
    console.log("NOT REACT!");
  }

  if (import.meta.VIKE_FRAMEWORK !== "react") console.log("NOT REACT BIS!");

  return content;
}
