import { Link } from "wouter";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileForbidden() {
  return (
    <div className="bg-card/50 border border-border/30 p-10 text-center">
      <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-black text-foreground mb-2">No shared club</h2>
      <p className="text-sm text-muted-foreground mb-6">
        You don't share a club with this member yet.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}
