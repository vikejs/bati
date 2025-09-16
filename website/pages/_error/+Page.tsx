import { usePageContext } from "vike-solid/usePageContext";

export default function Page() {
  const { is404 } = usePageContext();
  if (is404) {
    return (
      <>
        <h1>Page Not Found</h1>
        <p>This page could not be found.</p>
      </>
    );
  } else {
    return (
      <>
        <h1>Internal Error</h1>
        <p>Something went wrong.</p>
      </>
    );
  }
}
