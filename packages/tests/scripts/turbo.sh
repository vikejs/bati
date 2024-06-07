#!/bin/bash

# Check if bun executable is available in PATH
if command -v bun &> /dev/null; then
  cmd="bun x"
else
  cmd="pnpm exec"
fi

# Common arguments
args=(
  "turbo"
  "run"
  "test"
  "lint"
  "typecheck"
  "build"
  "--no-update-notifier"
  "--framework-inference"
  "false"
  "--env-mode"
  "loose"
  "--no-daemon"
)

# Check if running in CI environment
if [ -n "$CI" ]; then
  cacheDir="${RUNNER_TEMP:-$TMPDIR}/bati-cache"
  args+=("--concurrency" "2" "--cache-dir" "$cacheDir")
  cd "${RUNNER_TEMP:-$TMPDIR}/bati"
  echo "[turborepo] Using cache dir $cacheDir"
else
  cacheDir="${TMPDIR}/bati-cache"
  args+=("--cache-dir" "$cacheDir")
  cd "${TMPDIR}/bati"
  echo "[turborepo] Using cache dir $cacheDir"
fi

# Execute the command with arguments
eval "$cmd ${args[*]}"

if [ -n "$CI" ]; then
  rm -rf "${RUNNER_TEMP:-$TMPDIR}/bati"
else
  rm -rf "${TMPDIR}/bati"
fi
