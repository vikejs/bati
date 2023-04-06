export type { PageContextServer };
export type { PageContextClient };
export type { PageContext };

import type {
  PageContextBuiltIn,
  PageContextBuiltInClientWithClientRouting as PageContextBuiltInClient,
} from "vite-plugin-ssr/types";

type PageContextServer = PageContextBuiltIn;
type PageContextClient = PageContextBuiltInClient;
type PageContext = PageContextClient | PageContextServer;
