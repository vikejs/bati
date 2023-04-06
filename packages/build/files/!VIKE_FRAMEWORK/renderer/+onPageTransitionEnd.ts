export default onPageTransitionEnd;

function onPageTransitionEnd() {
  document.querySelector("body")!.classList.remove("page-is-transitioning");
}
