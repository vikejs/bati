// prettier-ignore
export const features = [
  "framework:solid", "framework:react", // "framework:vue",
  "db:edgedb", "db:prisma",
  "auth:authjs",
  // "error:logrocket", "error:sentry",
  "rpc:telefunc", // "rpc:trpc",
  "server:hattip", "server:express",
  "uikit:tailwindcss",
  "analytics:plausible.io",
  // "clientRouting", "prerendering",
] as const;

export const flags = new Map(features.map((f) => [f.split(":").at(-1), f] as const));

type AfterColon<T extends string> = T extends `${string}:${infer B}` ? B : never;

export type Flags = AfterColon<(typeof features)[number]>;
