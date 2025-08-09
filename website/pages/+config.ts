import type { Config } from "vike/types";
import vikeSolid from "vike-solid/config";
import faviconUrl from "#assets/logo.svg";

export default {
  prerender: true,
  favicon: faviconUrl,
  extends: vikeSolid,
} satisfies Config;
