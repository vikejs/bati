import { ESLint } from "eslint";
// force bundle those dependencies
import "@typescript-eslint/parser";
import "@typescript-eslint/eslint-plugin";
import "eslint-plugin-unused-imports";

export const eslint = new ESLint({
  useEslintrc: false,
  fix: true,
  overrideConfig: {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "unused-imports"],
    rules: {
      "unused-imports/no-unused-imports": "error",
    },
  },
});
