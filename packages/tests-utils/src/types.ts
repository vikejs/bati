import type { ChildProcess } from "node:child_process";

export interface AppContext {
  port: number;
  server: (Promise<void> & ChildProcess) | undefined;
}

// Raw flag combinations for `combinate()` (used by the rules unit test).
export type FlagMatrix = ReadonlyArray<string | ReadonlyArray<string | null | undefined>>;
