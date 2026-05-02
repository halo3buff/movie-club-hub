import { Link } from "wouter";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileNotFound() {
  return (
    <div className="bg-card/50 border border-border/30 p-10 text-center">
      <UserX className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-black text-foreground mb-2">User not found</h2>
      <p className="text-sm text-muted-foreground mb-6">
        We couldn't find that profile.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}
