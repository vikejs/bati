import { dim, yellow } from "colorette";
import { withIcon } from "../print.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const keys = ["dev", "build", "preview", "lint", "format", "deploy"] as const;

type Scripts = (typeof keys)[number];
type ValidScripts = Scripts | `${Scripts}:${string}`;

export interface PackageJsonDeps {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface PackageJsonScripts {
  scripts: Partial<Record<ValidScripts, string>>;
}

export interface PackageJsonScriptOption {
  value?: string;
  /**
   * Higher values have priority
   */
  precedence: number;
  warnIfReplaced?: boolean;
}

export type PackageJsonScriptOptions = Partial<Record<ValidScripts, PackageJsonScriptOption>>;

function* deps(obj: PackageJsonDeps) {
  if (obj.devDependencies) {
    for (const key in obj.devDependencies) {
      yield [key, obj.devDependencies[key]] as const;
    }
  }
  if (obj.dependencies) {
    for (const key in obj.dependencies) {
      yield [key, obj.dependencies[key]] as const;
    }
  }
}

function* findKey<T extends string | number | symbol>(depsMap: Map<string, string>, keys: T[]) {
  for (const key of keys) {
    const value = depsMap.get(key as string);
    if (!value) {
      throw new Error(`key '${value}' not found in package.json`);
    }
    yield [key, value] as const;
  }
}

// TODO: handle `workspace:` versions
export function addDependency<T extends PackageJsonDeps, U extends PackageJsonDeps>(
  packageJson: T,
  scopedPackageJson: U,
  keys: {
    devDependencies?: (keyof U["dependencies"] | keyof U["devDependencies"])[];
    dependencies?: (keyof U["dependencies"] | keyof U["devDependencies"])[];
  },
) {
  packageJson.devDependencies ??= {};
  packageJson.dependencies ??= {};
  const depsMap = new Map(deps(scopedPackageJson));

  for (const [key, value] of findKey(depsMap, keys.devDependencies ?? [])) {
    if (key in packageJson.dependencies) continue;
    packageJson.devDependencies[key as string] = value;
  }
  for (const [key, value] of findKey(depsMap, keys.dependencies ?? [])) {
    // dependency > devDependencies
    if (key in packageJson.devDependencies) delete packageJson.devDependencies[key as string];
    packageJson.dependencies[key as string] = value;
  }

  return packageJson;
}

const previousScripts: PackageJsonScriptOptions = {};

function warnScript(key: string, old: string, nnew: string) {
  console.warn(
    withIcon(
      "⚠",
      yellow,
    )(`Possible conflict between flags for "package.json":
    Old \`scripts.${key}\`: ${dim(old)}
    New \`scripts.${key}\`: ${dim(nnew)}
  You can check https://batijs.dev for more details.
`),
  );
}

export function setScripts<T extends PackageJsonScripts>(packageJson: T, scripts: PackageJsonScriptOptions) {
  const keys = Object.keys(scripts) as ValidScripts[];

  for (const key of keys) {
    const prev = previousScripts[key] ?? { precedence: -Infinity };
    const sub = scripts[key];

    if (sub) {
      if (sub.precedence > prev.precedence) {
        if (prev.warnIfReplaced) {
          warnScript(key, prev.value!, sub.value!);
        }

        packageJson.scripts[key] = sub.value;
        previousScripts[key] = Object.assign({ precedence: -Infinity }, sub);
      } else {
        if (sub.warnIfReplaced) {
          warnScript(key, sub.value!, prev.value!);
        }
      }
    }
  }

  return packageJson;
}
