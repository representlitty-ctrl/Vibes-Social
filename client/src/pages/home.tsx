import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { PostComposer } from "@/components/post-composer";
import { StoriesRow } from "@/components/stories-row";
import { Sparkles, Plus, Compass, PenSquare, FolderPlus, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useFeed } from "@/contexts/feed-context";
import type { Project, User, Profile, Community } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
  type?: "project";
};

interface PostUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  username?: string;
  isNewsBot?: boolean;
}

interface PostMedia {
  id: string;
  postId: string;
  mediaType: string;
  mediaUrl: string;
}

interface Post {
  id: string;
  userId: string;
  content: string | null;
  voiceNoteUrl: string | null;
  sourceUrl: string | null;
  createdAt: string;
  user: PostUser | null;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  type: "post";
}

type FeedItem = (ProjectWithDetails & { type: "project" }) | Post;

type CommunityWithDetails = Community & {
  memberCount: number;
  isMember: boolean;
};

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const { feedType } = useFeed();

  const { data: feed, isLoading: feedLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/feed"],
    enabled: !!user && feedType === "following",
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: globalFeed, isLoading: globalFeedLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/feed/global"],
    enabled: feedType === "global",
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: joinedCommunities } = useQuery<CommunityWithDetails[]>({
    queryKey: ["/api/communities/joined"],
    enabled: !!user,
  });

  const { data: communityPosts, isLoading: communityPostsLoading } = useQuery<any[]>({
    queryKey: ["/api/communities", feedType, "posts"],
    queryFn: async () => {
      if (feedType === "following" || feedType === "global") return [];
      const res = await fetch(`/api/communities/${feedType}/posts`);
      if (!res.ok) throw new Error("Failed to fetch community posts");
      return res.json();
    },
    enabled: !!user && feedType !== "following" && feedType !== "global",
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
    enabled: !user,
  });

  const { data: featuredProjects } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects/featured"],
  });

  const getCurrentFeed = () => {
    if (!user) return projects?.map(p => ({ ...p, type: "project" as const }));
    if (feedType === "following") return feed;
    if (feedType === "global") return globalFeed;
    return communityPosts?.map(p => ({ ...p, type: "post" as const }));
  };

  const isLoading = user 
    ? (feedType === "following" ? feedLoading : feedType === "global" ? globalFeedLoading : communityPostsLoading)
    : projectsLoading;
  const feedItems = getCurrentFeed();

  const handleNewPost = () => {
    setShowCreateMenu(false);
    setShowPostComposer(true);
  };

  const handleNewProject = () => {
    setShowCreateMenu(false);
    navigate("/submit");
  };

  return (
    <div className="space-y-4 p-4">
      {user && <StoriesRow />}

      {showPostComposer && user && (
        <PostComposer onClose={() => setShowPostComposer(false)} />
      )}

      {!user && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Vibes</h1>
            <p className="text-muted-foreground">Discover projects from the vibecoder community</p>
          </div>
          <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login-cta">
            Sign in to get started
          </Button>
        </div>
      )}

      {user && feedType === "following" && featuredProjects && featuredProjects.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Featured Projects</h2>
            </div>
            <Link href="/discover">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="link-discover-more">
                <Compass className="h-4 w-4" />
                Discover More
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <FeedItemSkeleton key={i} />
            ))}
          </div>
        ) : feedItems && feedItems.length > 0 ? (
          <div className="space-y-4">
            {feedItems.map((item) => (
              item.type === "post" ? (
                <PostCard key={`post-${item.id}`} post={item as Post} />
              ) : (
                <ProjectCard key={`project-${item.id}`} project={item as ProjectWithDetails} />
              )
            ))}
          </div>
        ) : (
          <EmptyState isLoggedIn={!!user} />
        )}
      </section>

      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          {showCreateMenu && (
            <div className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2">
              <Button
                onClick={handleNewPost}
                className="gap-2 shadow-lg"
                data-testid="button-create-post"
              >
                <PenSquare className="h-4 w-4" />
                New Post
              </Button>
              <Button
                onClick={handleNewProject}
                variant="outline"
                className="gap-2 shadow-lg bg-background"
                data-testid="button-create-project"
              >
                <FolderPlus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          )}
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            data-testid="button-create-fab"
          >
            {showCreateMenu ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedItemSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      {isLoggedIn ? (
        <>
          <h3 className="text-lg font-semibold">Your feed is empty</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Follow other vibecoders to see their posts and projects in your feed, or share something yourself!
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Be the first to share your vibecoded creation with the community!
          </p>
          <Button
            className="mt-6"
            onClick={() => window.location.href = "/api/login"}
          >
            Sign in to get started
          </Button>
        </>
      )}
    </Card>
  );
}
