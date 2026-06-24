import getPort from "get-port";
import type { AppContext } from "./types.js";

export async function initPort(context: AppContext) {
  context.port = await getPort();
}
