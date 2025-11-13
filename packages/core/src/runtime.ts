import packageJson from "../package.json" with { type: "json" };

export interface PackageManagerInfo {
  name: string;
  version?: string;
  run: string;
}

export function packageManager(): PackageManagerInfo {
  if (!process.env.npm_config_user_agent) {
    return {
      name: "npm",
      run: "npm run",
    };
  }
  return pmFromUserAgent(process.env.npm_config_user_agent);
}

function pmFromUserAgent(userAgent: string): PackageManagerInfo {
  const pmSpec = userAgent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  let name = pmSpec.substring(0, separatorPos);
  name = name === "npminstall" ? "cnpm" : name;
  return {
    name,
    version: pmSpec.substring(separatorPos + 1),
    run: name === "npm" ? "npm run" : name,
  };
}

export function getArgs() {
  const pm = packageManager().name;

  switch (pm) {
    case "pnpm":
      return "pnpm create vike@latest";
    case "yarn":
      return "yarn create vike@latest";
    case "bun":
      return "bun create vike@latest";
    default:
      return "npm create vike@latest ---";
  }
}

export function getVersion() {
  const parts = packageJson.version.split(".");
  const first = parts[0];
  const second = parts[1];
  const third = parts.slice(2).join(".");

  return {
    version: packageJson.version,
    semver: [first, second, third],
  };
}
