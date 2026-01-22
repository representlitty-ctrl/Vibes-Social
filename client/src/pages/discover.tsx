import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project-card";
import { Search, Rocket, Filter, Plus } from "lucide-react";
import type { Project, User, Profile } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
};

const popularTags = ["ai", "react", "game", "tool", "automation", "design", "mobile", "web3"];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects", { search: searchQuery, tag: selectedTag }],
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || project.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
          <p className="text-muted-foreground">Explore vibecoded projects from the community</p>
        </div>
        <Link href="/submit">
          <Button className="gap-2" data-testid="button-new-project">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
