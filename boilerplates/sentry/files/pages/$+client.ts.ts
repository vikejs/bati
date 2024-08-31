import { loadAsMagicast, generateCode, builders, type TransformerProps, parseModule } from "@batijs/core";

export default async function getViteConfig(props: TransformerProps) {
  let mod;
  try {
    mod = await loadAsMagicast(props);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    // create an empty module if the file is empty
    mod = parseModule("");
  }

  if (!props.meta.BATI.has("vue")) {
    // add `import { sentryBrowserConfig } from "../sentry.browser.config";` to the top of the file
    mod.imports.$prepend({
      from: "../sentry.browser.config",
      imported: "sentryBrowserConfig",
    });

    // add `sentryBrowserConfig()` function call to initialize Sentry to the end of the file
    const e = builders.functionCall("sentryBrowserConfig");
    const c = generateCode(e).code;
    //@ts-ignore
    mod.$ast.body.splice(mod.$ast.body.length - 1, 0, c);
  }
  return mod.generate().code;
}
