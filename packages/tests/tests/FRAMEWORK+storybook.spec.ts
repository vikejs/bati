import { describeBati, framework, spread, suite } from "@batijs/tests-utils";

export default suite()
  .case({ framework: spread(framework), flags: "storybook" })
  .linters("eslint");

await describeBati(({ test, expect }) => {
  test("storybook config files", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const storybookDir = process.cwd();

    const configExtensions = ["ts", "js", "mjs", "cjs"];
    let configFileExists = false;

    for (const ext of configExtensions) {
      const configPath = path.join(storybookDir, ".storybook", `main.${ext}`);
      try {
        await fs.access(configPath);
        configFileExists = true;
        break;
      } catch {
        // Continue to next extension
      }
    }

    expect(configFileExists).toBe(true);
  });

  test("storybook scripts", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const cwd = process.cwd();

    const packageJsonPath = path.join(cwd, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    expect(packageJson.scripts.storybook).toBeTruthy();
    expect(packageJson.scripts["build-storybook"]).toBeTruthy();
  });
});
