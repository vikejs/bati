import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";
import vikeReactQuery from "vike-react-query/config";

const config: Config = {
  extends: [vikeReact, vikeReactQuery, vikePhoton],
  photon: {
    server: "../server/entry.ts",
  },
} satisfies Config;

export default config;
