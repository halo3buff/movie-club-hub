import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetMeQueryKey,
  useUpdateMySettings,
  type UserMovieLinkPreference,
} from "@workspace/api-client-react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MovieLinkPreferenceFormProps {
  currentPreference: UserMovieLinkPreference;
}

const OPTIONS: Array<{ value: UserMovieLinkPreference; label: string; hint?: string }> = [
  { value: "letterboxd", label: "Letterboxd", hint: "default" },
  { value: "imdb", label: "IMDB" },
];

export function MovieLinkPreferenceForm({ currentPreference }: MovieLinkPreferenceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preference, setPreference] = useState<UserMovieLinkPreference>(currentPreference);

  const mutation = useUpdateMySettings({
    mutation: {
      onSuccess: () => {
        toast({ title: "Preference saved" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Failed to update preference",
          description: err instanceof Error ? err.message : "Request failed",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ data: { movieLinkPreference: preference } });
  };

  const dirty = preference !== currentPreference;

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Link2 className="w-4 h-4 text-primary" />
        <span className="font-serif font-semibold text-foreground">Movie links</span>
      </div>
      <p className="text-xs text-muted-foreground">Where movie titles open when clicked.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          {OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="movieLinkPreference"
                value={opt.value}
                checked={preference === opt.value}
                onChange={() => setPreference(opt.value)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                {opt.label}
              </span>
              {opt.hint && (
                <span className="text-xs text-muted-foreground/60">({opt.hint})</span>
              )}
            </label>
          ))}
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
