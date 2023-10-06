import which from "which";

export const bunExists = which.sync("bun", { nothrow: true }) !== null;
export const npmCli = bunExists ? "bun" : "pnpm";
