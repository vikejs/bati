export interface PackageJsonDeps {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

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

export function addDependency<T extends PackageJsonDeps, U extends PackageJsonDeps>(
  packageJson: T,
  scopedPackageJson: U,
  keys: (keyof U["dependencies"] | keyof U["devDependencies"])[]
) {
  packageJson.dependencies ??= {};
  const depsMap = new Map(deps(scopedPackageJson));

  for (const key of keys) {
    const value = depsMap.get(key as string);
    if (!value) {
      throw new Error(`key '${value}' not found in package.json`);
    }
    packageJson.dependencies[key as string] = value;
  }

  return packageJson;
}
