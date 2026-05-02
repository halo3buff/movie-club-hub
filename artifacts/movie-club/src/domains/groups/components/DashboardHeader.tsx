import { Film, LogOut, Settings, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserLink } from "@/domains/profiles/components/UserLink";

const SUPER_ADMIN_USERNAME = "dingle_documentary";

interface DashboardHeaderProps {
  userId?: number;
  username?: string;
  avatarUrl?: string | null;
  onSettings: () => void;
  onLogout: () => void;
  onSuperAdmin?: () => void;
}

export function DashboardHeader({
  userId,
  username,
  avatarUrl,
  onSettings,
  onLogout,
  onSuperAdmin,
}: DashboardHeaderProps) {
  const isSuperAdmin = username === SUPER_ADMIN_USERNAME;
  return (
    <header className="border-b-4 border-primary sticky top-0 z-10 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary flex items-center justify-center">
              <Film className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tight">
                MOVIE CLUBS
              </h1>
              <p className="text-sm text-white/80">
                {username ? `Welcome back, ${username}` : "Your cinematic journey"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && onSuperAdmin && (
              <button
                onClick={onSuperAdmin}
                className="p-2.5 border-2 border-primary bg-secondary text-primary hover:bg-primary hover:text-secondary transition-all"
                title="Global Admin"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            {typeof userId === "number" && username && (
              <UserLink userId={userId} className="block">
                <Avatar className="w-10 h-10 border-2 border-primary hover:border-white transition">
                  <AvatarImage src={avatarUrl ?? undefined} alt={username} />
                  <AvatarFallback className="bg-primary text-secondary text-sm font-black">
                    {username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </UserLink>
            )}
            <button
              onClick={onSettings}
              className="p-2.5 border-2 border-white/30 hover:border-primary bg-secondary text-white hover:text-primary transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 border-2 border-white/30 hover:border-primary bg-secondary text-white hover:text-primary transition-all font-bold uppercase text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
