export default function Page(props: { is404: boolean; errorInfo?: string }) {
  if (props.is404) {
    return (
      <>
        <h1>404 Page Not Found</h1>
        <p>This page could not be found.</p>
        <p>{props.errorInfo}</p>
      </>
    );
  } else {
    return (
      <>
        <h1>500 Internal Server Error</h1>
        <p>Something went wrong.</p>
      </>
    );
  }
}
