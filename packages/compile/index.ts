import { clean } from "./clean.js";
import { copyFilesToDist } from "./copy.js";
import { buildTypes } from "./dts.js";
import { build } from "./esbuild.js";

await clean();
await build();
await copyFilesToDist();
await buildTypes();
