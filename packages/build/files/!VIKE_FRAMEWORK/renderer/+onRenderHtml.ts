export default onRenderHtml;

import { escapeInject, dangerouslySkipEscape } from "vite-plugin-ssr/server";
import { PageLayout } from "./PageLayout";
import type { PageContextServer } from "./types";

async function onRenderHtml(pageContext: PageContextServer) {
  const { Page } = pageContext;
  const pageHtml = PageLayout(Page);
  return escapeInject`<!DOCTYPE html>
    <html>
      <body>
        <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
      </body>
    </html>`;
}
