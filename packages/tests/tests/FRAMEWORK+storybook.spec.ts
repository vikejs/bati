import { describeBati } from "@batijs/tests-utils";

export const matrix = [["solid", "react", "vue"], "storybook", "eslint"];

await describeBati(({ test, expect }) => {
  test("storybook config files", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");

    const storybookDir = (await import("child_process")).execSync("pwd", { encoding: "utf-8" }).trim();

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
    const fs = await import("fs/promises");
    const path = await import("path");

    const cwd = (await import("child_process")).execSync("pwd", { encoding: "utf-8" }).trim();

    const packageJsonPath = path.join(cwd, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

    expect(packageJson.scripts.storybook).toBeTruthy();
    expect(packageJson.scripts["build-storybook"]).toBeTruthy();
  });
});
