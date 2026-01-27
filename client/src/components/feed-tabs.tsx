import { useQuery } from "@tanstack/react-query";
import { useFeed } from "@/contexts/feed-context";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
      <Button
        variant={feedType === "following" ? "default" : "ghost"}
        size="sm"
        onClick={() => setFeedType("following")}
        className="gap-1.5 shrink-0 rounded-full"
        data-testid="tab-your-feed"
      >
        <Users className="h-3.5 w-3.5" />
        Your Feed
      </Button>
      <Button
        variant={feedType === "global" ? "default" : "ghost"}
        size="sm"
        onClick={() => setFeedType("global")}
        className="gap-1.5 shrink-0 rounded-full"
        data-testid="tab-global"
      >
        <Globe className="h-3.5 w-3.5" />
        Global
      </Button>
      {joinedCommunities?.map((community) => (
        <Button
          key={community.id}
          variant={feedType === community.id ? "default" : "ghost"}
          size="sm"
          onClick={() => setFeedType(community.id)}
          className="gap-1.5 shrink-0 rounded-full"
          data-testid={`tab-community-${community.id}`}
        >
          {community.name}
        </Button>
      ))}
    </div>
  );
}
