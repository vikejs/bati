import { afterAll, afterEach, assert, beforeAll, describe, test } from "vitest";
import { PackageJsonTransformer } from "../../src/utils/package.js";

describe("dependencies", () => {
  afterEach(() => {
    PackageJsonTransformer.clear();
  });

  test("simple", () => {
    const packageJson = {
      dependencies: {
        react: "^17.0.2",
      },
    };
    const scopedPackageJson = {
      dependencies: {
        lodash: "^4.17.21",
      },
    };

    {
      const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);
      transformer.addDependencies(["lodash"]);
      const result = JSON.parse(transformer.finalize());
      assert.equal(result.dependencies.lodash, "^4.17.21");
    }

    {
      const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);
      transformer.addDevDependencies(["lodash"]);
      const result = JSON.parse(transformer.finalize());
      assert.equal(result.devDependencies.lodash, "^4.17.21");
    }
  });

  test("merge with existing", () => {
    const packageJson = {
      dependencies: {
        react: "^17.0.2",
      },
    };
    const scopedPackageJson = {
      dependencies: {
        lodash: "^4.17.21",
      },
    };

    const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);
    transformer.addDependencies(["lodash"]);
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.dependencies.react, "^17.0.2");
    assert.equal(result.dependencies.lodash, "^4.17.21");
  });

  test("throw for invalid value", () => {
    const packageJson = {
      dependencies: {
        react: "^17.0.2",
      },
    };
    const scopedPackageJson = {
      dependencies: {
        lodash: "^4.17.21",
      },
    };

    const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);
    // @ts-expect-error
    assert.throws(() => transformer.addDependencies(["invalid_key"]));
  });

  test("add dependencies based on dependencies and devDependencies", () => {
    const packageJson = {
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

    const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);
    transformer.addDependencies(["lodash", "@types/lodash"]);
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.dependencies.lodash, "^4.17.21");
    assert.equal(result.dependencies["@types/lodash"], "^4.14.170");
  });
});

describe("scripts", { sequential: true }, () => {
  afterAll(() => {
    PackageJsonTransformer.clear();
  });

  const packageJson = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
  };
  const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);

  test("set", () => {
    transformer.setScript("dev", {
      value: "dev_script",
      precedence: 1,
    });
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.scripts.dev, "dev_script");
  });

  test("override", () => {
    transformer.setScript("dev", {
      value: "dev_script_2",
      precedence: 20,
    });
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.scripts.dev, "dev_script_2");
  });

  test("no override", () => {
    transformer.setScript("dev", {
      value: "dev_script_3",
      precedence: 10,
    });
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.scripts.dev, "dev_script_2");
  });

  test("remove", () => {
    transformer.removeScript("dev");
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.scripts.dev, undefined);
  });
});

describe("scripts + dependencies", { sequential: true }, () => {
  afterAll(() => {
    PackageJsonTransformer.clear();
  });

  let packageJson = {
    dependencies: {
      react: "^17.0.2",
    },
  };
  const scopedPackageJson = {
    dependencies: {
      lodash: "^4.17.21",
    },
  };
  const transformer = new PackageJsonTransformer(packageJson, scopedPackageJson);

  beforeAll(() => {
    transformer
      .setScript("dev", {
        value: "dev_script",
        precedence: 1,
      })
      .addDependencies(["lodash"], ["dev"]);
    packageJson = JSON.parse(transformer.finalize());
  });

  test("remove", () => {
    transformer.removeScript("dev");
    const result = JSON.parse(transformer.finalize());
    assert.equal(result.scripts.dev, undefined);
    assert.equal(result.dependencies.lodash, undefined);
  });
});
