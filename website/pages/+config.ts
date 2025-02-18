import faviconUrl from "#assets/logo.svg";
import vikeSolid from "vike-solid/config";
import type { Config } from "vike/types";

export default {
  prerender: true,
  favicon: faviconUrl,
  extends: vikeSolid,
} satisfies Config;
