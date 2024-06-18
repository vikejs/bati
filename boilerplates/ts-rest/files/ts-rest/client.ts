import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

const port = typeof location !== "undefined" ? location.port : "3000";

/**
 * ts-rest client
 *
 * This is the basic client, using fetch under the hood which is exported from @ts-rest/core
 * @link {@see https://ts-rest.com/docs/core/fetch/}
 **/
export const client = initClient(contract, {
  // TODO: properly retrieve host
  baseUrl: `http://localhost:${port}`,
  baseHeaders: {},
});
