import { useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { VHSNoise } from "@/components/ui/vhs-noise";
import { ProfilePageHeader } from "@/domains/profiles/components/ProfilePageHeader";
import { ProfileIdentityCard } from "@/domains/profiles/components/ProfileIdentityCard";
import { RecentActivityCard } from "@/domains/profiles/components/RecentActivityCard";
import { ProfileNotFound } from "@/domains/profiles/components/ProfileNotFound";
import { ProfileForbidden } from "@/domains/profiles/components/ProfileForbidden";
import { useUserProfile } from "@/domains/profiles/hooks/useGetUserProfile";

export default function UserProfile() {
  const [, params] = useRoute<{ userId: string }>("/users/:userId");
  const [, setLocation] = useLocation();
  const { data: me, isLoading: meLoading } = useGetMe();

  const userId = params ? parseInt(params.userId, 10) : NaN;
  const { status, profile } = useUserProfile(Number.isFinite(userId) ? userId : undefined);

  useEffect(() => {
    if (!meLoading && !me) setLocation("/");
  }, [me, meLoading, setLocation]);

  const isSelf = !!me && !!profile && me.id === profile.id;

  return (
    <div className="min-h-screen bg-background relative">
      <VHSNoise />
      <ProfilePageHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3" /> Back to dashboard
        </button>

        {(status === "loading" || meLoading) && <ProfileSkeleton />}
        {status === "notFound" && <ProfileNotFound />}
        {status === "forbidden" && <ProfileForbidden />}
        {status === "error" && (
          <div className="bg-card/50 border border-destructive/40 p-6 text-center text-destructive">
            <p className="font-bold mb-2">Something went wrong loading this profile.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        )}
        {status === "ok" && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
            <ProfileIdentityCard profile={profile} isSelf={isSelf} />
            <RecentActivityCard items={profile.recentActivity} />
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
      <div className="bg-card/50 border border-border/30 p-6 space-y-4">
        <Skeleton className="w-full aspect-square" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-1.5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
      <div className="bg-card/50 border border-border/30 p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[56px_1fr_auto] gap-4">
            <Skeleton className="w-14 aspect-[2/3]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
