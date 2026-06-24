import type { ExecHandle } from "./exec.js";

export interface AppContext {
  port: number;
  server: ExecHandle | undefined;
}

// Raw flag combinations for `combinate()` (used by the rules unit test).
export type FlagMatrix = ReadonlyArray<string | ReadonlyArray<string | null | undefined>>;
