import { dim, yellow } from "colorette";
import { withIcon } from "../print.js";
import type { StringTransformer } from "../types.js";

export interface PackageJsonDeps {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface PackageJsonScripts {
  scripts: Record<string, string>;
}

export interface PackageJsonScriptOption {
  value: string;
  /**
   * Higher values have priority
   */
  precedence: number;
  warnIfReplaced?: boolean;
}

export type PackageJsonScriptOptions = Record<
  string,
  {
    value?: string;
    precedence: number;
    warnIfReplaced?: boolean;
  }
>;

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

export class PackageJsonTransformer<U extends PackageJsonDeps> implements StringTransformer {
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

  setScript(name: string, args: PackageJsonScriptOption, condition: boolean = true) {
    if (!condition) {
      return this;
    }

    const prev = PackageJsonTransformer.previousScripts[name] ?? { precedence: -Infinity };

    if (args.precedence > prev.precedence) {
      if (prev.warnIfReplaced && prev.value) {
        warnScript(name, prev.value, args.value);
      }

      this.packageJson.scripts[name] = args.value;
      PackageJsonTransformer.previousScripts[name] = Object.assign({ precedence: -Infinity }, args);
      this.pendingReplacedScripts.push(name);
    } else {
      if (args.warnIfReplaced && prev.value) {
        warnScript(name, args.value, prev.value);
      }
    }

    return this;
  }

  removeScript(name: string, condition: boolean = true) {
    if (!condition) {
      return this;
    }

    PackageJsonTransformer.previousScripts[name] = { precedence: -Infinity };
    this.pendingReplacedScripts.push(name);
    delete this.packageJson.scripts[name];

    return this;
  }

  addDependencies(newDeps: AllDependencies<U>[], condition?: boolean): this;
  addDependencies(newDeps: AllDependencies<U>[], onlyUsedBy?: string[], condition?: boolean): this;
  addDependencies(newDeps: AllDependencies<U>[], onlyUsedBy?: string[] | boolean, condition?: boolean) {
    if (typeof onlyUsedBy === "boolean") {
      condition = onlyUsedBy;
      onlyUsedBy = [];
    } else if (typeof condition !== "boolean") {
      condition = true;
      onlyUsedBy ??= [];
    }

    if (!condition) {
      return this;
    }

    this._addDependencies("dependencies", newDeps);
    this._onlyUsedBy(newDeps, onlyUsedBy);

    return this;
  }

  addDevDependencies(newDeps: AllDependencies<U>[], condition?: boolean): this;
  addDevDependencies(newDeps: AllDependencies<U>[], onlyUsedBy?: string[], condition?: boolean): this;
  addDevDependencies(newDeps: AllDependencies<U>[], onlyUsedBy?: string[] | boolean, condition?: boolean) {
    if (typeof onlyUsedBy === "boolean") {
      condition = onlyUsedBy;
      onlyUsedBy = [];
    } else if (typeof condition !== "boolean") {
      condition = true;
      onlyUsedBy ??= [];
    }

    if (!condition) {
      return this;
    }

    this._addDependencies("devDependencies", newDeps);
    this._onlyUsedBy(newDeps, onlyUsedBy);

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

    return JSON.stringify(this.packageJson, undefined, 2);
  }

  private _onlyUsedBy(newDeps: AllDependencies<U>[], onlyUsedBy: string[] = []) {
    for (const dep of newDeps) {
      if (!PackageJsonTransformer.dependenciesScriptsRelation.has(dep)) {
        PackageJsonTransformer.dependenciesScriptsRelation.set(dep, new Set());
      }
      for (const script of onlyUsedBy) {
        PackageJsonTransformer.dependenciesScriptsRelation.get(dep)!.add(script);
      }
    }
  }

  private _addDependencies(pkgKey: "devDependencies" | "dependencies", newDeps: AllDependencies<U>[]) {
    const otherKey = pkgKey === "devDependencies" ? "dependencies" : "devDependencies";

    this.packageJson[pkgKey] ??= {};
    const depsMap = new Map(deps(this.scopedPackageJson));

    for (const [key, value] of findKey(depsMap, newDeps)) {
      const other = this.packageJson[otherKey] ?? {};
      if (key in other) continue;
      this.packageJson[pkgKey][key as string] = value;
      this.pendingAddedDependencies.push(key as string);
    }
  }

  /**
   * Instead of removing a previously added dep, use `onlyUsedBy` parameter when adding a dependency
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
