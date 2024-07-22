import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
// @ts-ignore
import react from "eslint-plugin-react/configs/recommended.js";
// See https://github.com/solidjs-community/eslint-plugin-solid/issues/118
// import solid from "eslint-plugin-solid/configs/typescript";
import solid from "eslint-plugin-solid/dist/configs/typescript.js";
// @ts-ignore
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/*.cjs", "**/dist/*", "**/node_modules/*"],
  },
  {
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2022,
      },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
        ecmaVersion: 2022,
      },
      globals: {
        BATI: false,
      },
    },
  },
  {
    rules: {
      "no-unused-labels": 0,
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/ban-types": 0,
      "@typescript-eslint/consistent-type-imports": 0,
      "@typescript-eslint/no-non-null-assertion": 0,
      "@typescript-eslint/no-empty-interface": 0,
      "@typescript-eslint/no-namespace": 0,
      "@typescript-eslint/no-unused-vars": [
        1,
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": 0,
    },
  },
  {
    // React
    files: [
      "boilerplates/react/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}",
      "boilerplates/react-*/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}",
    ],
    ...react,
    languageOptions: {
      ...react.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // SolidJS
    ...solid,
    files: ["boilerplates/solid/**/*", "boilerplates/solid-*/**/*"],
    rules: {
      "solid/components-return-once": 0,
    },
  },
  ...pluginVue.configs["flat/recommended"],
  {
    rules: {
      "vue/multi-word-component-names": 0,
      "vue/singleline-html-element-content-newline": 0,
      "vue/max-attributes-per-line": 0,
      "vue/html-self-closing": 0,
    },
  },
  // {
  //   // VueJS
  //   extends: ["plugin:vue/vue3-recommended"],
  //   files: ["boilerplates/vue/**/*.vue", "boilerplates/vue-*/**/*.vue"],
  //   parserOptions: {
  //     parser: "@typescript-eslint/parser",
  //     sourceType: "module",
  //     ecmaVersion: 2021,
  //   },
  // },
  prettier,
);
