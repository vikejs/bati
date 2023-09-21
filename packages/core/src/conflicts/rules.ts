import { err, requires, type Rule } from "./utils";

export default [
  // TODO use https://www.npmjs.com/package/ansi-to-html for the Web part
  requires(
    err`A ${"Server"} is mandatory when using ${"Auth"}. Check https://vite-plugin-ssr.com/integration#server-side-tools for details and https://batijs.github.io for available servers`,
    "auth",
    ["server"],
  ),
] satisfies Rule[];
