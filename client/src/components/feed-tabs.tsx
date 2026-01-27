import { useQuery } from "@tanstack/react-query";
import { useFeed } from "@/contexts/feed-context";
import { useAuth } from "@/hooks/use-auth";
import { Globe, Users } from "lucide-react";
import type { Community } from "@shared/schema";

type CommunityWithDetails = Community & {
  memberCount: number;
  isMember: boolean;
};

export function FeedTabs() {
  const { user } = useAuth();
  const { feedType, setFeedType } = useFeed();

  const { data: joinedCommunities } = useQuery<CommunityWithDetails[]>({
    queryKey: ["/api/communities/joined"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div 
      className="flex gap-1 overflow-x-auto scrollbar-hide px-2"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      data-testid="feed-tabs-header"
    >
      <button
        onClick={() => setFeedType("following")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          feedType === "following"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        }`}
        data-testid="tab-your-feed"
      >
        <Users className="h-3.5 w-3.5" />
        Your Feed
      </button>
      <button
        onClick={() => setFeedType("global")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          feedType === "global"
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-muted-foreground hover:bg-muted"
        }`}
        data-testid="tab-global"
      >
        <Globe className="h-3.5 w-3.5" />
        Global
      </button>
      {joinedCommunities?.map((community) => (
        <button
          key={community.id}
          onClick={() => setFeedType(community.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            feedType === community.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
          data-testid={`tab-community-${community.id}`}
        >
          {community.name}
        </button>
      ))}
    </div>
  );
}
