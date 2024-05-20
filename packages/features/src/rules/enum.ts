export enum RulesMessage {
  // --- ERROR
  // A Server is required when using Auth
  ERROR_AUTH_R_SERVER,
  // React is required when using Compiled CSS
  ERROR_COMPILED_R_REACT,
  // Auth0 does not support Hono server as it officialy supports only express middleware
  ERROR_AUTH0_E_HONO,
  // A Server is required when using Drizzle
  ERROR_DRIZZLE_R_SERVER,

  // --- WARNING

  // --- INFO
  // HatTip is an experimental project
  INFO_HATTIP,
}
