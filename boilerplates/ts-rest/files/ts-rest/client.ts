import { initClient } from "@ts-rest/core";
import { contract } from "./contract";

const port = import.meta.env.PORT ? parseInt(import.meta.env.PORT, 10) : 3000;

export const client = initClient(contract, {
  baseUrl: `http://localhost:${port}`,
  baseHeaders: {},
});
