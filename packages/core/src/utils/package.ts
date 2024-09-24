import { dim, yellow } from "colorette";
import { withIcon } from "../print.js";

export interface PackageJsonDeps {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface PackageJsonScripts {
  scripts: Record<string, string>;
}

export interface PackageJsonScriptOption {
  value?: string;
  /**
   * Higher values have priority
   */
  precedence: number;
  warnIfReplaced?: boolean;
}

export type PackageJsonScriptOptions = Record<string, PackageJsonScriptOption>;

type AllDependencies<U extends PackageJsonDeps> = keyof U["dependencies"] | keyof U["devDependencies"];

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

export class PackageJsonTransformer<U extends PackageJsonDeps> {
  protected static previousScripts: PackageJsonScriptOptions = {};
  // All dependencies listed here will never be removed
  protected static forcedDependencies: Set<string> = new Set();
  // Key is a dependency, value is the list of scripts that are using this dependency
  protected static dependenciesScriptsRelation: Map<string | symbol | number, Set<string>> = new Map();

  protected pendingAddedDependencies: string[];
  protected pendingReplacedScripts: string[];

  constructor(
    public packageJson: PackageJsonScripts & PackageJsonDeps,
    public scopedPackageJson: U,
  ) {
    this.pendingAddedDependencies = [];
    this.pendingReplacedScripts = [];
  }

  setScripts(scripts: PackageJsonScriptOptions, condition: boolean = true) {
    if (!condition) {
      return this;
    }

    const keys = Object.keys(scripts);

    for (const key of keys) {
      const prev = PackageJsonTransformer.previousScripts[key] ?? { precedence: -Infinity };
      const sub = scripts[key];

      if (sub) {
        if (sub.precedence > prev.precedence) {
          if (prev.warnIfReplaced) {
            warnScript(key, prev.value!, sub.value!);
          }

          this.packageJson.scripts[key] = sub.value!;
          PackageJsonTransformer.previousScripts[key] = Object.assign({ precedence: -Infinity }, sub);
          this.pendingReplacedScripts.push(key);
        } else {
          if (sub.warnIfReplaced) {
            warnScript(key, sub.value!, prev.value!);
          }
        }
      }
    }

    return this;
  }

  addDependency(
    keys: { devDependencies?: AllDependencies<U>[]; dependencies?: AllDependencies<U>[] },
    condition: boolean = true,
  ) {
    if (!condition) {
      return this;
    }

    this.packageJson.devDependencies ??= {};
    this.packageJson.dependencies ??= {};
    const depsMap = new Map(deps(this.scopedPackageJson));

    for (const [key, value] of findKey(depsMap, keys.devDependencies ?? [])) {
      if (key in this.packageJson.dependencies) continue;
      this.packageJson.devDependencies[key as string] = value;
      this.pendingAddedDependencies.push(key as string);
    }
    for (const [key, value] of findKey(depsMap, keys.dependencies ?? [])) {
      // dependency > devDependencies
      if (key in this.packageJson.devDependencies) delete this.packageJson.devDependencies[key as string];
      this.packageJson.dependencies[key as string] = value;
      this.pendingAddedDependencies.push(key as string);
    }

    return this;
  }

  /**
   * Use this method if `dependency` is ONLY used by given scripts (i.e. not used in code)
   */
  dependencyOnlyUsedBy(dependency: AllDependencies<U>, scripts: string[], condition: boolean = true) {
    if (!condition) {
      return this;
    }

    PackageJsonTransformer.dependenciesScriptsRelation.set(dependency, new Set(scripts));

    return this;
  }

  finalize() {
    // Compute forcedDependencies
    for (const dep of this.pendingAddedDependencies) {
      if (!PackageJsonTransformer.dependenciesScriptsRelation.has(dep)) {
        PackageJsonTransformer.forcedDependencies.add(dep);
      }
    }

    // Remove dependencies of replaced scripts if necessary
    for (const script of this.pendingReplacedScripts) {
      // If dep is forced, do nothing (i.e. keep it)
      if (PackageJsonTransformer.forcedDependencies.has(script)) continue;

      for (const [dep, scripts] of PackageJsonTransformer.dependenciesScriptsRelation.entries()) {
        // If a dep is related to the current script...
        if (scripts.has(script)) {
          scripts.delete(script);
          // ... delete the dep if no more scripts are using it
          if (scripts.size === 0) {
            this.removeDependency(dep as string);
            PackageJsonTransformer.dependenciesScriptsRelation.delete(dep);
          }
        }
      }
    }

    // stringify
  }

  /**
   * Instead of removing a previsouly added dep, use `dependencyOnlyUsedBy`
   */
  private removeDependency(key: string) {
    if (this.packageJson.devDependencies?.[key]) {
      delete this.packageJson.devDependencies[key];
    }
    if (this.packageJson.dependencies?.[key]) {
      delete this.packageJson.dependencies[key];
    }

    return this.packageJson;
  }
}
