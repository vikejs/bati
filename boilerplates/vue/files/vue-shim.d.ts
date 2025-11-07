// Without this file, `tsc` will fail with such errors:
//     pages/+config.ts:2:20 - error TS2307: Cannot find module '../layouts/Layout.vue' or its corresponding type declarations.
//       import Layout from "../layouts/Layout.vue";
//                          ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// See https://stackoverflow.com/questions/71477277/typescript-cannot-find-module-in-vue-project

declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}
