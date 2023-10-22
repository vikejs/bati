import { render } from "squirrelly";
import type { VikeMeta } from "../types.js";

// We use /*{ and }*/ as Squirrelly delimiters so that {{ and }} remain untouched in Vue SFC files, in which
// they are used in Vue <template>s.
// Also, /* */ is considered comments in CSS and JS, so it doesn't break syntax coloration on those files
export const tags: [string, string] = ["/*{", "}*/"];

export function renderSquirrelly(template: string, meta: VikeMeta): string {
  return render(
    template,
    {
      import: {
        meta,
      },
    },
    {
      tags,
    },
  );
}
