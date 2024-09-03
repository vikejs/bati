import { loadAsMagicast, type TransformerProps } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  const mod = await loadAsMagicast(props);

  const replacement = `new URL("./", import.meta.url).pathname`;
  addResolveAlias(mod, "@", replacement);

  // convert placeholder (type is string) to replacement (type is expression) to be evaluated in final code
  return mod.generate().code.replace(`"{{PLACEHOLDER_ALIAS}}"`, replacement);
}

function addResolveAlias(mod, find: string, replacement: string) {
  const alias = mod.exports.default.$args[0]?.resolve?.alias ?? {};
  const warnMsg = `${yellow("WARN")}: new resolve.alias: \`"${find}":${replacement}\` replaced existing in vite.config.ts.`;
  if (alias?.length === undefined) {
    if (alias[find]) {
      console.warn(warnMsg);
    }
    alias[find] = "{{PLACEHOLDER_ALIAS}}";
  } else {
    // type is array
    const newAlias = {
      find: find,
      replacement: "{{PLACEHOLDER_ALIAS}}",
    };
    const index = alias.findIndex((a: { find: string }) => a?.find === find);
    if (index >= 0) {
      console.warn(warnMsg);
      alias.splice(index, 1);
    }
    alias.push(newAlias);
  }
  if (!mod.exports.default.$args[0]?.resolve) mod.exports.default.$args[0].resolve = {};
  mod.exports.default.$args[0].resolve.alias = alias;
}

function yellow(str: string) {
  const { env = {}, argv = [], platform = "" } = typeof process === "undefined" ? {} : process;

  const isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
  const isForced = "FORCE_COLOR" in env || argv.includes("--color");
  const isWindows = platform === "win32";
  const isDumbTerminal = env.TERM === "dumb";

  const isCompatibleTerminal = env.TERM && !isDumbTerminal;

  const isCI = "CI" in env && ("GITHUB_ACTIONS" in env || "GITLAB_CI" in env || "CIRCLECI" in env);

  const isColorSupported = !isDisabled && (isForced || (isWindows && !isDumbTerminal) || isCompatibleTerminal || isCI);

  return isColorSupported ? `\x1b[43m${str}\x1b[0m` : str;
}
