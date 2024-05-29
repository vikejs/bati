import { $, usePowerShell, type Options } from "zx";

const isWin = process.platform === "win32";

$.preferLocal = true;

if (isWin) {
  usePowerShell();
}

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
