// https://vike.dev/data

import fetch from "cross-fetch";
//import { filterMovieData } from '../filterMovieData'
import type { Movie, MovieDetails } from "../types";

// export { onBeforePrerenderStart };

export type Data = Awaited<ReturnType<typeof data>>;

export const data = async () => {
  const movies = await getStarWarsMovies();
  return {
    // We remove data we don't need because the data is passed to
    // the client; we should minimize what is sent over the network.
    movies: filterMoviesData(movies),
    // vike-react's renderer will use this data as page's <title>
    title: getTitle(movies),
  };
};

async function getStarWarsMovies(): Promise<MovieDetails[]> {
  const response = await fetch("https://star-wars.brillout.com/api/films.json");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let movies: MovieDetails[] = ((await response.json()) as any).results;
  movies = movies.map((movie: MovieDetails, i: number) => ({
    ...movie,
    id: String(i + 1),
  }));
  return movies;
}

function filterMoviesData(movies: MovieDetails[]): Movie[] {
  return movies.map((movie: MovieDetails) => {
    const { title, release_date, id } = movie;
    return { title, release_date, id };
  });
}

/*
export async function onBeforePrerenderStart() {
  const movies = await getStarWarsMovies();
  return [
    {
      url: '/star-wars',
      // We already provide `pageContext` here so that Vike
      // will *not* have to call the `data()` hook defined
      // above in this file.
      pageContext: {
        data: {
          movies: filterMoviesData(movies),
          title: getTitle(movies)
        }
      }
    },
    ...movies.map((movie) => {
      const url = `/star-wars/${movie.id}`
      return {
        url,
        // Note that we can also provide the `pageContext` of other pages.
        // This means that Vike will not call any
        // `data()` hook and the Star Wars API will be called
        // only once (in this `onBeforePrerenderStart()` hook).
        pageContext: {
          data: {
            movie: filterMovieData(movie),
            title: movie.title
          }
        }
      }
    })
  ];
}
*/

function getTitle(movies: Movie[] | MovieDetails[]): string {
  const title = `${movies.length} Star Wars Movies`;
  return title;
}
