import { type TransformerProps, transformConfig } from "@batijs/core";

const IMPORT = `import { sentryBrowserConfig } from "../sentry.browser.config";`;
const CALL = `sentryBrowserConfig();`;

export default async function getClientEntry(props: TransformerProps): Promise<unknown> {
  // Vue initializes Sentry elsewhere — no browser-config injection in the client entry.
  if (props.meta.BATI.has("vue")) return undefined;

  const previous = (await props.readfile?.()) ?? "";
  // No existing client entry: create one that initializes Sentry's browser SDK.
  if (previous.trim() === "") return `${IMPORT}\n\n${CALL}\n`;

  // Otherwise inject the import and the init call before the entry's default export.
  return transformConfig(props, (root) => {
    root.ensureImport(IMPORT);
    const exp = root.find("export_statement").first();
    if (exp.size() > 0) exp.insertBefore(`${CALL}\n\n`);
  });
}
