import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface UserLinkProps {
  userId: number;
  className?: string;
  children: React.ReactNode;
  /**
   * If true, the link click won't bubble to parent click handlers.
   * Use inside rows/cards that are themselves clickable.
   */
  stopPropagation?: boolean;
}

export function UserLink({ userId, className, children, stopPropagation }: UserLinkProps) {
  return (
    <Link
      to={`/users/${userId}`}
      className={cn(
        "cursor-pointer hover:opacity-80 transition-opacity inline-flex items-center",
        className,
      )}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {children}
    </Link>
  );
}
