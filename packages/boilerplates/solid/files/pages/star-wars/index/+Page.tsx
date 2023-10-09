import { For } from "solid-js";
import type { Movie } from "../types";

export default function Page(props: { movies: Movie[] }) {
  return (
    <>
      <h1>Star Wars Movies</h1>
      <ol>
        <For each={props.movies}>
          {(movie) => (
            <li>
              <a href={`/star-wars/${movie.id}`}>{movie.title}</a> ({movie.release_date})
            </li>
          )}
        </For>
      </ol>
      <p>
        Source: <a href="https://star-wars.brillout.com">star-wars.brillout.com</a>.
      </p>
    </>
  );
}
