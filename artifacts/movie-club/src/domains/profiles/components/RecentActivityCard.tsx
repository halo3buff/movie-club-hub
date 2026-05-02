import { Star } from "lucide-react";
import type { ActivityItem } from "@workspace/api-client-react";
import { formatRelativeTime } from "../lib/relativeTime";

interface RecentActivityCardProps {
  items: ActivityItem[];
}

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <div className="bg-card/50 border border-border/30 p-5 lg:p-6">
      <p className="text-[11px] tracking-[0.18em] uppercase text-primary font-black mb-3">
        Recent Activity
      </p>

      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground py-6 text-center">
          No activity yet.
        </p>
      ) : (
        <div className="divide-y divide-border/40">
          {items.slice(0, 10).map((item) => (
            <ActivityRow key={item.filmId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="grid grid-cols-[44px_1fr_auto] lg:grid-cols-[56px_1fr_auto] gap-3 lg:gap-4 py-3 lg:py-4 items-start">
      <Poster posterUrl={item.posterUrl} title={item.title} />
      <div className="min-w-0">
        <p className="text-sm lg:text-base font-bold text-foreground truncate">
          {item.title}
          {item.year != null && (
            <span className="text-muted-foreground font-normal"> · {item.year}</span>
          )}
        </p>
        {item.rating != null && (
          <div className="flex items-center gap-1 text-primary text-xs mt-0.5">
            {renderStars(item.rating)}
          </div>
        )}
        {item.review && (
          <p className="text-xs text-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">
            "{item.review}"
          </p>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
        {formatRelativeTime(item.watchedAt)}
      </div>
    </div>
  );
}

function Poster({ posterUrl, title }: { posterUrl: string | null | undefined; title: string }) {
  if (posterUrl) {
    return (
      <img
        src={posterUrl}
        alt={title}
        className="w-11 lg:w-14 aspect-[2/3] object-cover border border-border/40"
        loading="lazy"
      />
    );
  }
  return <div className="w-11 lg:w-14 aspect-[2/3] bg-muted border border-border/40" />;
}

function renderStars(rating: number) {
  // rating is on a 1-10 scale (DB constraint); halve for the 5-star display.
  const full = Math.max(0, Math.min(5, Math.round(rating / 2)));
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className="w-3 h-3"
      fill={i < full ? "currentColor" : "none"}
      strokeWidth={i < full ? 0 : 1.5}
    />
  ));
}
