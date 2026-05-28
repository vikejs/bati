import { defineConfig } from "bumpp";

export default defineConfig({
  files: ["package.json", "packages/*/package.json"],
  release: "patch",
  commit: true,
  push: true,
  tag: true,
  // Refresh bun.lock so `bun pm pack` (run by `bun publish`) rewrites
  // `workspace:*` to the freshly-bumped versions, then stage the lockfile
  // alongside the version bumps. See oven-sh/bun#5050.
  execute: "bun install",
  all: true,
});
