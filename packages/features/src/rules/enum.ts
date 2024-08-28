export enum RulesMessage {
  // --- ERROR
  // A Server is required when using Auth
  ERROR_AUTH_R_SERVER,
  // React is required when using Compiled CSS
  ERROR_COMPILED_R_REACT,
  // React is required when using Mantine UI Components Framework
  ERROR_MANTINE_R_REACT,
  // A Server is required when using Drizzle
  ERROR_DRIZZLE_R_SERVER,
  // A Server is required when using Data fetching / RPC
  ERROR_DATA_R_SERVER,
  // A compabible Server (or no Server) is required when using Cloudflare
  ERROR_CLOUDFLARE_R_COMPAT_SERVER,
  // A compabible Server (or no Server) is required when using Cloudflare
  ERROR_AWS_R_COMPAT_SERVER,
  // --- WARNING

  // --- INFO
  // HatTip is an experimental project
  INFO_HATTIP,
  // Drizzle does not work on Stackblitz (because of better-sqlite3 dependency)
  INFO_DRIZZLE_STACKBLITZ,
}
