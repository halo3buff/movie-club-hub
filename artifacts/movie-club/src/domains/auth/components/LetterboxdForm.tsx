import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMeQueryKey,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import { ExternalLink, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LETTERBOXD_USERNAME_RE = /^[a-zA-Z0-9_]{0,50}$/;

interface LetterboxdFormProps {
  currentLetterboxdUsername: string | null | undefined;
}

export function LetterboxdForm({ currentLetterboxdUsername }: LetterboxdFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(currentLetterboxdUsername ?? "");

  const mutation = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: "Letterboxd account updated" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Failed to update",
          description: err instanceof Error ? err.message : "Request failed",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!LETTERBOXD_USERNAME_RE.test(trimmed)) {
      toast({
        title: "Invalid Letterboxd username",
        description: "Letters, numbers, and underscores only (max 50 characters).",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ data: { letterboxdUsername: trimmed } });
  };

  const dirty = value.trim() !== (currentLetterboxdUsername ?? "");

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Film className="w-4 h-4 text-primary" />
        <span className="font-serif font-semibold text-foreground">Letterboxd account</span>
      </div>
      {currentLetterboxdUsername ? (
        <p className="text-xs text-muted-foreground">
          Linked to{" "}
          <a
            href={`https://letterboxd.com/${currentLetterboxdUsername}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground font-medium hover:underline inline-flex items-center gap-1"
          >
            letterboxd.com/{currentLetterboxdUsername}
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Connect your Letterboxd profile so other club members can find you.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Letterboxd username</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="your-username"
            maxLength={50}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-9 text-sm rounded-md bg-background border border-border px-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
          />
          <p className="text-xs text-muted-foreground/60 mt-1">
            Letters, numbers, and underscores only. Leave blank to unlink.
          </p>
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={mutation.isPending || !dirty}
          className="bg-primary hover:bg-primary/90"
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}
