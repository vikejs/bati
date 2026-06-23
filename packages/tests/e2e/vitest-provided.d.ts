import type { Kind, Mode } from "./matrix.js";
import "vitest";

// Per-project values passed via `test.provide`, read with `inject(...)`.
declare module "vitest" {
  interface ProvidedContext {
    flags: string[];
    appDir: string;
    mode: Mode;
    kind: Kind | undefined;
    dockerAvailable: boolean;
  }
}
