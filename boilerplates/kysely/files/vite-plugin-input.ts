/*{ @if (!it.BATI.hasD1) }*/
import type { Plugin } from "vite";

/**
 * Add entries to the ssr build step. Used to compile kysely migration scripts
 */
export function inputPlugin({ name, entry, env = "ssr" }: { name: string; entry: string; env?: string }): Plugin {
  return {
    name: `input-plugin:${name}`,

    config() {
      return {
        environments: {
          [env]: {
            build: {
              rolldownOptions: {
                input: {
                  [name]: entry,
                },
              },
            },
          },
        },
      };
    },
  };
}
/*{ /if }*/
