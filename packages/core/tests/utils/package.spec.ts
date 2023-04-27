import { test } from "uvu";
import * as assert from "uvu/assert";
import { addDependency } from "../../src/index.js";
import type { PackageJsonDeps } from "../../src/index.js";

// Tests that new dependencies are added to packageJson when keys parameter contains valid keys from scopedPackageJson dependencies/devDependencies.
test("test_add_dependency_with_valid_keys", () => {
  const packageJson: PackageJsonDeps = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
  };
  const result = addDependency(packageJson, scopedPackageJson, {
    dependencies: ["lodash"],
  });
  assert.equal(result.dependencies?.lodash, "^4.17.21");
});

// Tests that new dependencies are added to packageJson when it already has some dependencies.
test("test_add_dependency_with_existing_dependencies", () => {
  const packageJson: PackageJsonDeps = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
  };
  const result = addDependency(packageJson, scopedPackageJson, {
    dependencies: ["lodash"],
  });
  assert.equal(result.dependencies?.react, "^17.0.2");
  assert.equal(result.dependencies?.lodash, "^4.17.21");
});

// Tests that an error is thrown when keys parameter contains invalid keys from scopedPackageJson dependencies/devDependencies.
test("test_add_dependency_with_invalid_keys", () => {
  const packageJson: PackageJsonDeps = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
  };
  assert.throws(() =>
    addDependency(packageJson, scopedPackageJson, {
      dependencies: ["invalid_key"] as any,
    })
  );
});

// Tests that new dependencies are added to packageJson when scopedPackageJson has dependencies and devDependencies.
test("test_add_dependency_with_dev_dependencies", () => {
  const packageJson: PackageJsonDeps = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
    devDependencies: {
      "@types/lodash": "^4.14.170",
    },
  };
  const result = addDependency(packageJson, scopedPackageJson, {
    dependencies: ["lodash", "@types/lodash"],
  });
  assert.equal(result.dependencies?.lodash, "^4.17.21");
  assert.equal(result.dependencies?.["@types/lodash"], "^4.14.170");
});

test.run();
