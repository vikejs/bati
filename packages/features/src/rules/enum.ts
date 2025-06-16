export enum RulesMessage {
  // --- ERROR
  // A Server is required when using Auth
  ERROR_AUTH_R_SERVER,
  // React is required when using Compiled CSS
  ERROR_COMPILED_R_REACT,
  // A Server is required when using Drizzle
  ERROR_DRIZZLE_R_SERVER,
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
}
