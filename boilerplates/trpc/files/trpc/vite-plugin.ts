import type { AnyRouter } from "@trpc/server";
import {
  type NodeHTTPHandlerOptions,
  type NodeHTTPRequest,
  nodeHTTPRequestHandler,
  type NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import type { PluginOption } from "vite";
import { appRouter } from "./server.js";

type TrpcPluginOptions<
  TRouter extends AnyRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
> = {
  /**
   * Path where the trpc router will be mounted.
   * @default '/api/trpc'
   */
  basePath: string;
} & NodeHTTPHandlerOptions<TRouter, TRequest, TResponse>;

export default function trpc<
  TRouter extends AnyRouter,
  TRequest extends NodeHTTPRequest,
  TResponse extends NodeHTTPResponse,
>(options?: TrpcPluginOptions<TRouter, TRequest, TResponse>): PluginOption {
  return {
    name: "trpc",
    configureServer(server) {
      server.middlewares.use(options?.basePath || "/api/trpc", (req, res) => {
        const url = new URL(req.url || "/", "http://localhost");
        const path = url.pathname.replace(/^\//, "");

        return nodeHTTPRequestHandler({
          req: req as TRequest,
          res: res as TResponse,
          path,
          router: (options?.router || appRouter) as BATI.Any,
          createContext: options?.createContext,
          batching: options?.batching,
          responseMeta: options?.responseMeta,
          maxBodySize: options?.maxBodySize,
          onError: options?.onError,
        });
      });
    },
  };
}
