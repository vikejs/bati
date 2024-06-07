# Check if bun executable is available in PATH
if (Get-Command bun -ErrorAction SilentlyContinue) {
  $cmd = "bun x"
} else {
  $cmd = "pnpm exec"
}

# Common arguments
$args = @(
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
if ($env:CI) {
  $cacheDir = "${env:RUNNER_TEMP -or $env:TMPDIR}/bati-cache"
  $args += @("--concurrency", "2", "--cache-dir", $cacheDir)
  Set-Location "${env:RUNNER_TEMP -or $env:TMPDIR}/bati"
  Write-Output "[turborepo] Using cache dir $cacheDir"
} else {
  $cacheDir = "${env:TMPDIR}/bati-cache"
  $args += @("--cache-dir", $cacheDir)
  Set-Location "${env:TMPDIR}/bati"
  Write-Output "[turborepo] Using cache dir $cacheDir"
}

# Execute the command with arguments
Invoke-Expression "$cmd $($args -join ' ')"

if ($env:CI) {
  Remove-Item -Recurse -Force "${env:RUNNER_TEMP -or $env:TMPDIR}/bati"
} else {
  Remove-Item -Recurse -Force "${env:TMPDIR}/bati"
}
