export function toLetterboxdSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLetterboxdUrl(title: string): string {
  return `https://letterboxd.com/film/${toLetterboxdSlug(title)}/`;
}

export function getImdbUrl(imdbId: string): string {
  return `https://www.imdb.com/title/${imdbId}/`;
}

export type MovieLinkPreference = "letterboxd" | "imdb";

export function getMovieUrl(
  title: string,
  imdbId: string | null | undefined,
  preference: MovieLinkPreference,
): string {
  if (preference === "imdb" && imdbId) return getImdbUrl(imdbId);
  return getLetterboxdUrl(title);
}
