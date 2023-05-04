import { ESLint } from "eslint";

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
