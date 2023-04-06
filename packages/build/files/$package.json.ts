export interface SimplePackageJson {
  name: string;
  version: string;
  description: string;
  type: "module";
  scripts: Record<string, string>;
  keywords: string[];
  author: string;
  devDependencies: Record<string, string>;
  dependencies: Record<string, string>;
}

export default function getPackageJson() {
  let content: SimplePackageJson = {
    name: "PLACEHOLDER",
    version: "0.0.1",
    description: "",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite build && vite preview",
    },
    keywords: [],
    author: "",
    devDependencies: {
      "@types/node": "^18.0.0",
      typescript: "^5.0.0",
      vite: "^4.0.0",
      "vite-plugin-ssr": "^0.4.0",
    },
    dependencies: {},
  };

  if (import.meta.VIKE_FRAMEWORK === "react") {
    content.dependencies = {
      "@vitejs/plugin-react": "^3.0.0",
      react: "^18.0.0",
      "react-dom": "^18.0.0",
    };
    content.devDependencies = {
      "@types/react": "^18.0.0",
      "@types/react-dom": "^18.0.0",
    };
  } else if (import.meta.VIKE_FRAMEWORK === "solid") {
    content.dependencies = {
      "solid-js": "^1.0.0",
    };
    content.devDependencies = {
      "vite-plugin-solid": "^2.0.0",
    };
  }

  return content;
}
