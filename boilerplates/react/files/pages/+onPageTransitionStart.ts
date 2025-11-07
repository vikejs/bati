export const onPageTransitionStart = () => {
  console.log("Page transition start");
  document.querySelector("body")?.classList.add("page-is-transitioning");
};
