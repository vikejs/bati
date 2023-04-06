export default onPageTransitionStart;

function onPageTransitionStart() {
  document.querySelector("body")!.classList.add("page-is-transitioning");
}
