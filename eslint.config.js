// @ts-nocheck

import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react/configs/recommended.js";
import solid from "eslint-plugin-solid/configs/typescript";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/*.cjs",
      "**/*.ts.build-*.mjs",
      "**/dist/*",
      "**/node_modules/*",
      "**/.DS_Store",
      "**/styled-system/*",
      "**/files/styled-system/*",
      "scripts/gen-composite-workflow-action.js",
      "pnpm-lock.yaml",
    ],
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
        ...globals.serviceworker,
        ...globals.browser,
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
    files: ["boilerplates/react/**/*.tsx", "boilerplates/react-*/**/*.tsx"],
    rules: {
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
    },
  },
  {
    // SolidJS
    ...solid,
    files: ["boilerplates/solid/**/*", "boilerplates/solid-*/**/*"],
    rules: {
      "solid/components-return-once": 0,
      "solid/no-innerhtml": "error",
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
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
        ecmaVersion: "latest",
      },
    },
  },
  // Vue
  ...pluginVue.configs["flat/recommended"],
  {
    rules: {
      "vue/multi-word-component-names": 0,
      "vue/singleline-html-element-content-newline": 0,
      "vue/max-attributes-per-line": 0,
      "vue/html-self-closing": 0,
    },
  },
  prettier,
);
