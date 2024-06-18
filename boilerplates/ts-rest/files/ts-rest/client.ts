import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

const port = typeof location !== "undefined" ? location.port : "3000";

export const client = initClient(contract, {
  // TODO: properly retrieve host
  baseUrl: `http://localhost:${port}`,
  baseHeaders: {},
});
