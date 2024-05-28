import { $, type Options } from "zx";

$.preferLocal = true;

export function exec(file: string, args?: string[], options?: Partial<Options>) {
  const childProcess = $({
    ...(options ?? {}),
    env: {
      ...process.env,
      ...(options ?? { env: {} }).env,
    },
  })`${file} ${args ?? []}`;

  return childProcess;
}
