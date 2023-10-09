import { Show } from "solid-js";

export default function Page(props: { is404: boolean; errorInfo?: string }) {
  return (
    <Show
      when={props.is404}
      fallback={
        <>
          <h1>500 Internal Server Error</h1>
          <p>Something went wrong.</p>
        </>
      }
    >
      <h1>404 Page Not Found</h1>
      <p>This page could not be found.</p>
      <p>{props.errorInfo}</p>
    </Show>
  );
}
