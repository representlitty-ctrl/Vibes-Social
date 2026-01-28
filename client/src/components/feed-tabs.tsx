import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useFeed } from "@/contexts/feed-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Community } from "@shared/schema";

type CommunityWithDetails = Community & {
  memberCount: number;
  isMember: boolean;
};

export function FeedTabs() {
  const { user } = useAuth();
  const { feedType, setFeedType } = useFeed();
  const [location] = useLocation();

  const { data: joinedCommunities } = useQuery<CommunityWithDetails[]>({
    queryKey: ["/api/communities/joined"],
    enabled: !!user,
  });

  // Only show feed tabs on the home page
  if (!user || location !== "/") return null;

  // Build list of tabs - always Feed and Global, plus any communities
  const tabs = [
    { id: "following", label: "Feed" },
    { id: "global", label: "Global" },
    ...(joinedCommunities?.map(c => ({ id: c.id, label: c.name })) || []),
  ];

  return (
    <div 
      className="flex w-full"
      data-testid="feed-tabs-header"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setFeedType(tab.id)}
          className={cn(
            "flex-1 py-2 text-sm font-medium text-center transition-colors border-b-2",
            feedType === tab.id
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted"
          )}
          data-testid={`tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
