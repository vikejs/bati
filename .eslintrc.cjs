module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["*.cjs"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  env: {
    node: true,
  },
  rules: {
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/ban-types": 0,
    "@typescript-eslint/consistent-type-imports": 0,
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/no-empty-interface": 0,
    "@typescript-eslint/no-unused-vars": [
      1,
      {
        argsIgnorePattern: "^_",
      },
    ],
  },
  overrides: [
    {
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": 0,
      },
    },
  ],
};
