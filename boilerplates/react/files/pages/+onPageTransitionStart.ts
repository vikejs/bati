import type { PageContextClient } from "vike/types";

export async function onPageTransitionStart(pageContext: Partial<PageContextClient>) {
  console.log("Page transition start");
  console.log("Is backwards navigation?", pageContext.isBackwardNavigation);
  document.body.classList.add("page-transition");
}
