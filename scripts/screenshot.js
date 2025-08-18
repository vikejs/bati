// @ts-ignore

import { writeFile } from "node:fs/promises";
import createBrowser from "browserless";

const browser = createBrowser();

const browserless = await browser.createContext();

const buffer = await browserless.screenshot("http://batijs.dev", {
  element: ".bati-widget",
  type: "png",
  click: ["[data-flag=react]", "[data-flag=tailwindcss]", "[data-flag=telefunc]", "[data-flag=hono]"],
  viewport: {
    deviceScaleFactor: 1,
  },
});

await writeFile("./doc/screenshot.png", buffer);

await browserless.destroyContext();

// At the end, gracefully shutdown the browser process
await browser.close();
