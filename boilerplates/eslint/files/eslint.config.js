// @ts-nocheck

import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
// @ts-expect-error missing type definitions
import react from "eslint-plugin-react/configs/recommended.js";
// Waiting for full eslint@9 support https://github.com/solidjs-community/eslint-plugin-solid/issues/137
import solid from "eslint-plugin-solid/dist/configs/typescript.js";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
  //# BATI.has("vue")
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
  //# BATI.has("react")
  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
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
  //# BATI.has("solid")
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ...solid,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "tsconfig.json",
      },
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  //# BATI.has("vue")
  ...pluginVue.configs["flat/recommended"],
  //# BATI.has("prettier")
  prettier,
);
