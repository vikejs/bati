export default onRenderClient;

import { getTitle } from "./getTitle";
import type { PageContextClient } from "./types";
import { PageLayout } from "./PageLayout";

async function onRenderClient(pageContext: PageContextClient) {
  if (!pageContext.isHydration) {
    const { Page } = pageContext;
    const pageHtml = PageLayout(Page);
    document.getElementById("page-view")!.innerHTML = pageHtml;
  }
  hydrateCounters();

  const title = getTitle(pageContext);
  if (title !== null) {
    document.title = title;
  }
}

function hydrateCounters() {
  document.querySelectorAll(".counter").forEach((counter) => {
    let count = 0;
    (counter as HTMLElement).onclick = () => {
      counter.textContent = `Counter ${++count}`;
    };
  });
}
