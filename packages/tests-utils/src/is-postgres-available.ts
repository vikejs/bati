import net from "node:net";

/**
 * Best-effort TCP check that a PostgreSQL server is reachable at the given connection string
 * (defaults to `DATABASE_URL`, then `localhost:5432`) — used to poll the container for readiness
 * before the run starts.
 */
export function isPostgresAvailable(connectionString = process.env.DATABASE_URL): Promise<boolean> {
  let host = "localhost";
  let port = 5432;
  try {
    const url = new URL(connectionString ?? "");
    if (url.hostname) host = url.hostname;
    if (url.port) port = Number(url.port);
  } catch {
    // Not a parseable URL — fall back to localhost:5432.
  }

  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (available: boolean) => {
      socket.destroy();
      resolve(available);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}
