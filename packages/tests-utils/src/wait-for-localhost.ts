// https://github.com/sindresorhus/wait-for-localhost
import http from "node:http";

export function waitForLocalhost({
  port,
  path,
  useGet,
  timeout,
  debug,
}: {
  port?: number;
  path?: string;
  useGet?: boolean;
  timeout?: number;
  debug?: string;
} = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const retry = () => {
      if (Number.isInteger(timeout) && startedAt + timeout! < Date.now()) {
        reject(new Error(debug ? "Timeout" : `Timeout (${debug})`));
      } else {
        setTimeout(main, 200);
      }
    };

    const method = useGet ? "GET" : "HEAD";

    const doRequest = (ipVersion: 4 | 6, next: (...args: unknown[]) => void) => {
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
          timeout: 1000,
        },
        (response) => {
          if (response.statusCode === 200) {
            resolve({ ipVersion });
            return;
          }

          next();
        },
      );

      request.on("error", next);
      request.end();
    };

    const main = () => {
      doRequest(4, () => doRequest(6, () => retry()));
    };

    main();
  });
}
