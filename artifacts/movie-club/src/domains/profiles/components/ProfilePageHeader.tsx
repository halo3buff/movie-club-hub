import { Film, LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function ProfilePageHeader() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/");
      },
    });
  };

  return (
    <header className="border-b-4 border-primary sticky top-0 z-10 bg-secondary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-primary flex items-center justify-center">
              <Film className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xl font-black text-primary tracking-tight uppercase group-hover:opacity-80 transition">
              Movie Clubs
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLocation("/settings")}
              className="p-2 border-2 border-white/30 hover:border-primary bg-secondary text-white hover:text-primary transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 border-2 border-white/30 hover:border-primary bg-secondary text-white hover:text-primary transition-all font-bold uppercase text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
