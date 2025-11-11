import type { PageContextClient } from "vike/types";

export async function onPageTransitionEnd(pageContext: PageContextClient) {
  console.log("Page transition end");
  console.log("pageContext.isBackwardNavigation", pageContext.isBackwardNavigation);
  document.body.classList.remove("page-transition");
}
