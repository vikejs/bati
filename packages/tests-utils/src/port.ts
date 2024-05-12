import getPort from "get-port";
import type { GlobalContext } from "./types.js";

export async function initPort(context: GlobalContext) {
  context.port = await getPort();
  context.port_1 = await getPort();
}
