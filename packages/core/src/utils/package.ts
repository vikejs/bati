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
  }
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
