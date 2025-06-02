import which from "which";

const isWin = process.platform === "win32";
export const bunExists = isWin ? false : which.sync("bun", { nothrow: true }) !== null;
export const npmCli = bunExists && !process.env.FORCE_PNPM ? "bun" : "pnpm";
