import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = [
  { emoji: "heart", icon: "❤️" },
  { emoji: "fire", icon: "🔥" },
  { emoji: "rocket", icon: "🚀" },
  { emoji: "clap", icon: "👏" },
  { emoji: "eyes", icon: "👀" },
  { emoji: "100", icon: "💯" },
];

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  user?: { id: string; firstName?: string | null };
}

interface EmojiReactionsProps {
  targetType: "project" | "comment";
  targetId: string;
  className?: string;
}

export function EmojiReactions({ targetType, targetId, className }: EmojiReactionsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: reactions = [] } = useQuery<Reaction[]>({
    queryKey: ["/api/reactions", targetType, targetId],
  });

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("POST", "/api/reactions", { emoji, targetType, targetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reactions", targetType, targetId] });
      setIsOpen(false);
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("DELETE", "/api/reactions", { emoji, targetType, targetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reactions", targetType, targetId] });
    },
  });

  const groupedReactions = EMOJI_OPTIONS.map(({ emoji, icon }) => {
    const reactionUsers = reactions.filter(r => r.emoji === emoji);
    const hasReacted = reactionUsers.some(r => r.userId === user?.id);
    return { emoji, icon, count: reactionUsers.length, hasReacted };
  }).filter(r => r.count > 0);

  const handleEmojiClick = (emoji: string) => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    
    const existing = reactions.find(r => r.emoji === emoji && r.userId === user.id);
    if (existing) {
      removeReactionMutation.mutate(emoji);
    } else {
      addReactionMutation.mutate(emoji);
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {groupedReactions.map(({ emoji, icon, count, hasReacted }) => (
        <button
          key={emoji}
          onClick={() => handleEmojiClick(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors",
            hasReacted 
              ? "bg-primary/20 hover:bg-primary/30" 
              : "bg-muted hover:bg-muted/80"
          )}
          data-testid={`reaction-${emoji}-${targetId}`}
        >
          <span>{icon}</span>
          <span className="text-xs font-medium">{count}</span>
        </button>
      ))}
      
      {user && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full"
              data-testid={`button-add-reaction-${targetId}`}
            >
              {groupedReactions.length === 0 ? (
                <Smile className="h-4 w-4" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {EMOJI_OPTIONS.map(({ emoji, icon }) => {
                const hasReacted = reactions.some(r => r.emoji === emoji && r.userId === user?.id);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className={cn(
                      "rounded-md p-2 text-lg transition-colors hover:bg-muted",
                      hasReacted && "bg-primary/20"
                    )}
                    data-testid={`emoji-option-${emoji}`}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
