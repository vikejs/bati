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
    "no-unused-labels": 0,
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
      // Tests
      files: ["*.spec.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": 0,
      },
    },
    {
      // SolidJS
      extends: ["plugin:solid/typescript"],
      plugins: ["solid"],
      files: ["boilerplates/solid/**/*", "boilerplates/solid-*/**/*"],
      rules: {
        "solid/components-return-once": 0,
      },
    },
    {
      // VueJS
      extends: ["plugin:vue/vue3-recommended"],
      files: ["boilerplates/vue/**/*", "boilerplates/vue-*/**/*"],
      parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
        ecmaVersion: 2020,
      },
      rules: {
        "vue/multi-word-component-names": 0,
        "vue/singleline-html-element-content-newline": 0,
        "vue/max-attributes-per-line": 0,
        "vue/html-self-closing": 0,
      },
    },
  ],
};
