import { defineConfig } from "bumpp";

export default defineConfig({
  files: ["package.json", "packages/*/package.json"],
  release: "patch",
  commit: true,
  push: true,
  tag: true,
});
