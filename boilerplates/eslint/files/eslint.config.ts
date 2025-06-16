import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import solid from "eslint-plugin-solid/configs/typescript";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint, { type ConfigArray } from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  {
    ignores: [
      "dist/*",
      // Temporary compiled files
      "**/*.ts.build-*.mjs",
      //# BATI.has("vercel")
      ".vercel/*",
      //# BATI.has("aws")
      "cdk.out/*",
      //# BATI.has("panda-css")
      "styled-system/",
      // JS files at the root of the project
      "*.js",
      "*.cjs",
      "*.mjs",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        1,
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-namespace": 0,
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
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
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
  } as ConfigArray[number],
  //# BATI.has("react")
  react.configs.flat["jsx-runtime"] as ConfigArray[number],
  //# BATI.has("solid")
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ...solid,
    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  //# BATI.has("vue")
  ...(pluginVue.configs["flat/recommended"] as ConfigArray),
  //# BATI.has("vue")
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": "off",
    },
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  //# BATI.has("compiled-css")
  {
    rules: {
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
    },
  },
  //# BATI.has("prettier")
  prettier as ConfigArray[number],
);
