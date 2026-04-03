import * as fs from "node:fs";
import * as path from "node:path";
import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext, PrepareOptions } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runProd(context: GlobalContext, script?: PrepareOptions["script"]) {
  inspectCurrentFolder();
  const cmd = ["run", script ?? "prod", "--port", String(context.port)];
  context.server = exec(npmCli, cmd, {
    env: {
      PORT: String(context.port),
      NODE_ENV: "production",
    },
  });

  const res = await Promise.race([
    // wait for port
    waitForLocalhost({
      port: context.port,
      useGet: true,
      timeout: process.env.CI ? 30000 : 15000,
      debug: cmd.join(" "),
    }),
    // or for server to crash
    context.server,
  ]);

  if (!res) {
    throw new Error("Server stopped before tests could run");
  }

  return { server: context.server, port: context.port };
}

function inspectCurrentFolder(): void {
  // 1. Print current working directory
  const cwd = process.cwd();
  console.log("📂 Current Working Directory:", cwd);

  // 2. List files in the current folder (non-recursive)
  console.log("\n📋 Files in current folder:");
  const entries = fs.readdirSync(cwd, { withFileTypes: true });
  entries.forEach((entry) => {
    const type = entry.isDirectory() ? "📁" : "📄";
    console.log(`  ${type} ${entry.name}`);
  });

  // 3. Show content of package.json
  const packageJsonPath = path.join(cwd, "package.json");
  console.log("\n📦 package.json content:");
  if (fs.existsSync(packageJsonPath)) {
    const raw = fs.readFileSync(packageJsonPath, "utf-8");
    const parsed = JSON.parse(raw);
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    console.log("  ⚠️  No package.json found in current directory.");
  }
}
