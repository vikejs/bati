import { build } from "./build.js";
import { clean } from "./clean.js";
import { copyFilesToDist } from "./copy.js";

await clean();
await build();
await copyFilesToDist();
