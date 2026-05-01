import { ExternalLink } from "lucide-react";
import { getMovieUrl } from "../lib/letterboxd";

interface MovieTitleLinkProps {
  title: string;
  imdbId?: string | null;
  preference: "letterboxd" | "imdb";
  className?: string;
  showIcon?: boolean;
}

export function MovieTitleLink({
  title,
  imdbId,
  preference,
  className = "",
  showIcon = false,
}: MovieTitleLinkProps) {
  const url = getMovieUrl(title, imdbId, preference);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:text-[#FDB913] transition-colors inline-flex items-center gap-1 ${className}`}
    >
      {title}
      {showIcon && <ExternalLink className="w-4 h-4 opacity-50" />}
    </a>
  );
}
