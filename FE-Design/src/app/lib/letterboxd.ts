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

export function getMovieUrl(
  title: string,
  imdbId: string | null | undefined,
  preference: "letterboxd" | "imdb"
): string {
  if (preference === "imdb" && imdbId) {
    return getImdbUrl(imdbId);
  }
  // Fall back to Letterboxd if IMDB preferred but no ID available
  return getLetterboxdUrl(title);
}
