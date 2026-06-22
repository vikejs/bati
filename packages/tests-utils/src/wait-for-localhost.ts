// https://github.com/sindresorhus/wait-for-localhost
import http from "node:http";

export function waitForLocalhost({
  port,
  path,
  useGet,
  timeout,
  debug,
}: {
  port: number;
  path?: string;
  useGet?: boolean;
  timeout: number;
  debug: string;
}) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const method = useGet ? "GET" : "HEAD";

    // Each attempt has its own timer so a connected-but-unresponsive server (e.g. a
    // dev server still warming up) is abandoned after 1s and retried — rather than
    // holding the socket open forever and starving the overall `timeout`.
    const attempt = (ipVersion: 4 | 6) => {
      let settled = false;
      const done = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      const request = http.request(
        {
          method,
          port,
          path,
          family: ipVersion,
          // https://github.com/vitejs/vite/issues/9520
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          },
        },
        (response) => {
          if (response.statusCode === 200) done(() => resolve({ ipVersion }));
          else done(() => next(ipVersion));
        },
      );

      const timer = setTimeout(
        () =>
          done(() => {
            request.destroy();
            next(ipVersion);
          }),
        1000,
      );

      request.on("error", () => done(() => next(ipVersion)));
      request.end();
    };

    const next = (ipVersion: 4 | 6) => {
      if (ipVersion === 4) {
        attempt(6);
      } else if (Date.now() < deadline) {
        setTimeout(() => attempt(4), 200);
      } else {
        reject(new Error(debug ? `Timeout (${debug})` : "Timeout"));
      }
    };

    attempt(4);
  });
}
