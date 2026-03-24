import { clean } from "./clean.js";
import { copyFilesToDist } from "./copy.js";
import { build } from "./tsdown.js";

// import { buildTypes } from "./dts.js";
// import { build, buildConfig } from "./esbuild.js";

await clean();
// await buildConfig();
// await build();
await build();
await copyFilesToDist();
