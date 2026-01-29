import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/project-card";
import { useAuth } from "@/hooks/use-auth";
import { Search, Rocket, Plus, Bookmark, TrendingUp, Flame } from "lucide-react";
import type { Project, User, Profile } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
  hasBookmarked?: boolean;
};

const popularTags = ["ai", "react", "game", "tool", "automation", "design", "mobile", "web3"];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
  });

  const { data: bookmarkedProjects, isLoading: isLoadingBookmarks } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects/bookmarked"],
    enabled: !!user,
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || project.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  // Get trending projects sorted by upvotes and views (copy array to avoid mutation)
  const trendingProjects = projects
    ? [...projects]
        .sort((a, b) => {
          const scoreA = (a.upvoteCount || 0) * 2 + (a.viewCount || 0);
          const scoreB = (b.upvoteCount || 0) * 2 + (b.viewCount || 0);
          return scoreB - scoreA;
        })
        .slice(0, 6)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-2 py-4 md:px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground">Explore vibecoded projects from the community</p>
      </div>

      {/* Trending Section */}
      {trendingProjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Trending Projects</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {trendingProjects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="flex-shrink-0 w-[200px] p-3 hover-elevate cursor-pointer">
                  {project.imageUrl && (
                    <div className="aspect-video w-full rounded-md overflow-hidden mb-2 bg-muted">
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-medium text-sm line-clamp-1">{project.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {project.upvoteCount || 0}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-projects">All Projects</TabsTrigger>
          {user && (
            <TabsTrigger value="saved" data-testid="tab-saved-projects">
              <Bookmark className="mr-2 h-4 w-4" />
              Saved
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
            data-testid="tag-all"
          >
            All
          </Badge>
          {popularTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              data-testid={`tag-${tag}`}
            >
              {tag}
            </Badge>
          ))}
        </div>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 rounded-lg border bg-card p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? (
            <div className="space-y-4">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No projects found</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                {searchQuery || selectedTag
                  ? "Try adjusting your search or filters."
                  : "Be the first to submit a project!"}
              </p>
              {!searchQuery && !selectedTag && (
                <Link href="/submit">
                  <Button className="mt-6 gap-2">
                    <Plus className="h-4 w-4" />
                    Submit Your Project
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          {isLoadingBookmarks ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 rounded-lg border bg-card p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookmarkedProjects && bookmarkedProjects.length > 0 ? (
            <div className="space-y-4">
              {bookmarkedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
              <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No saved projects</h3>
              <p className="mt-2 text-muted-foreground">
                Bookmark projects to save them for later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
