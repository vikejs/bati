import packageJson from "../package.json";

export function packageManager() {
  if (!process.env.npm_config_user_agent) {
    return undefined;
  }
  return pmFromUserAgent(process.env.npm_config_user_agent);
}

function pmFromUserAgent(userAgent: string) {
  const pmSpec = userAgent.split(" ")[0];
  const separatorPos = pmSpec.lastIndexOf("/");
  const name = pmSpec.substring(0, separatorPos);
  return {
    name: name === "npminstall" ? "cnpm" : name,
    version: pmSpec.substring(separatorPos + 1),
  };
}

export function getArgs() {
  const pm = packageManager()?.name;

  switch (pm) {
    case "pnpm":
      return "pnpm create bati";
    case "yarn":
      return "yarn dlx @batijs/cli";
    case "bun":
      return "bun create bati";
    default:
      return "npm create bati ---";
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
