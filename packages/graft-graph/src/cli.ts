import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { buildGraph } from "./index.js";
import { toDot, toJson, toSvg, toText } from "./render.js";

const { values } = parseArgs({
  options: {
    format: { type: "string", default: "text" }, // text | json | dot | svg
    out: { type: "string" }, // write to this file instead of stdout
  },
});

const rendered = await render(await buildGraph(), values.format!);
if (values.out) await writeFile(values.out, rendered);
else process.stdout.write(rendered);

function render(graph: Awaited<ReturnType<typeof buildGraph>>, format: string): string | Promise<string> {
  switch (format) {
    case "text":
      return toText(graph);
    case "json":
      return toJson(graph);
    case "dot":
      return toDot(graph);
    case "svg":
      return toSvg(graph);
    default:
      console.error(`unknown --format "${format}" (text | json | dot | svg)`);
      return process.exit(1);
  }
}
