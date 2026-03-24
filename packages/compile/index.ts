import { clean } from "./clean.js";
import { copyFilesToDist } from "./copy.js";
import { build } from "./tsdown.js";

await clean();
await build();
await copyFilesToDist();
