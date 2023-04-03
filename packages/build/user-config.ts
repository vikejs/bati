export interface UserConfig {
  VIKE_FRAMEWORK?: "react" | "solid" | "vue";
  VIKE_DATABASE?: "edgedb" | "prisma" | string;
  VIKE_AUTH?: "authjs" | string;
  VIKE_ERROR_TRACKING?: "logrocket" | "sentry" | string;
  VIKE_TYPESCRIPT?: boolean;
  VIKE_CLIENT_ROUTING?: boolean;
  VIKE_RPC?: "telefunc" | "trpc";
  VIKE_PRERENDERING?: boolean;
}
