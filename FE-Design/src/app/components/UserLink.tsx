// FE-Design/src/app/components/UserLink.tsx
import { Link } from "react-router";

interface UserLinkProps {
  user: {
    id: string | number;
    name: string;
    avatar: string;
  };
  showAvatar?: boolean;
  showName?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export function UserLink({
  user,
  showAvatar = true,
  showName = true,
  avatarSize = "md",
  className = "",
}: UserLinkProps) {
  return (
    <Link
      to={`/user/${user.id}`}
      className={`inline-flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      {showAvatar && (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizeClasses[avatarSize]} rounded-full border-2 border-[#FDB913]`}
        />
      )}
      {showName && (
        <span className="font-bold text-white hover:text-[#FDB913] transition-colors">
          {user.name}
        </span>
      )}
    </Link>
  );
}
