import type { FileOperation } from "./common.js";
import { orderBy } from "../utils.js";

export class OperationsRearranger {
  private files: Map<string, FileOperation[]>;

  constructor() {
    this.files = new Map();
  }

  addFile(file: FileOperation): void {
    if (!this.files.has(file.destination)) {
      this.files.set(file.destination, []);
    }
    this.files.get(file.destination)!.push(file);
  }

  *compute() {
    for (const file of this.files.values()) {
      if (file.filter((op) => op.important).length >= 2) {
        throw new Error(`Error while trying to generate file: '${file[0].destination}'.
Multiple important file is not yet supported.
Please report this issue to https://github.com/vikejs/bati`);
      }

      const newOrder = orderBy(file, (op) => {
        if (op.kind === "file" && !op.important) return 1;
        if (op.kind === "file" && op.important) return 2;
        if (op.kind === "transform" && !op.important) return 3;
        if (op.kind === "transform" && op.important) return 4;
        return 0;
      });

      // Keep only the last occurence of { kind: "file" }, unless it's a .d.ts file
      if (file[0].sourceAbsolute.endsWith(".d.ts")) {
        yield* newOrder.filter((op) => op.kind === "file");
      } else {
        const input = newOrder.filter((op) => op.kind === "file").at(-1);

        if (input) {
          yield input;
        }
      }

      yield* newOrder.filter((op) => op.kind !== "file");
    }
  }
}
