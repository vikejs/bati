export enum RulesMessage {
  // --- ERROR
  // A Server is required when using Auth
  ERROR_AUTH_R_SERVER,
  // React is required when using Compiled CSS
  ERROR_COMPILED_R_REACT,
  // A Server is required when using Drizzle
  ERROR_DRIZZLE_R_SERVER,
  // A Server is required when using Kysely
  ERROR_KYSELY_R_SERVER,
  // A Server is required when using SQLite
  ERROR_SQLITE_R_SERVER,
  // A Server is required when using PostgreSQL
  ERROR_POSTGRES_R_SERVER,
  // PostgreSQL and the raw SQLite tool are mutually exclusive database engines
  ERROR_POSTGRES_X_SQLITE,
  // Prisma manages its own database engine; not combinable with the PostgreSQL engine (yet)
  ERROR_POSTGRES_X_PRISMA,
  // A Server is required when using Data fetching / RPC
  ERROR_DATA_R_SERVER,
  // A compabible Server (or no Server) is required when using Cloudflare
  ERROR_CLOUDFLARE_R_COMPAT_SERVER,
  // A compabible Server (or no Server) is required when using Cloudflare
  ERROR_AWS_R_COMPAT_SERVER,
  // React is required when using Mantine UI Components Framework
  ERROR_MANTINE_R_REACT,
  // shadcn/ui is only compatible with React
  ERROR_SHADCN_R_REACT,

  // --- WARNING
  // shadcn/ui integration is tailored for tailwind
  WARN_SHADCN_R_TAILWINDCSS,

  // --- INFO
  // Some tools do not work on Stackblitz
  INFO_STACKBLITZ_COMPAT,
  // Storybook requires a supported UI framework (React, Vue, or Solid)
  ERROR_STORYBOOK_R_UI_FRAMEWORK,
}
