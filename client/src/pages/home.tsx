import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project-card";
import { Sparkles, TrendingUp, Clock, Plus } from "lucide-react";
import type { Project, User, Profile } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
};

export default function HomePage() {
  const { data: projects, isLoading } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects"],
  });

  const { data: featuredProjects } = useQuery<ProjectWithDetails[]>({
    queryKey: ["/api/projects/featured"],
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground">Discover the latest projects from the community</p>
        </div>
        <Link href="/submit">
          <Button className="gap-2" data-testid="button-new-project">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {featuredProjects && featuredProjects.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Featured</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.slice(0, 3).map((project) => (
              <ProjectCard key={project.id} project={project} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Trending Today</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} rank={index + 1} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">No projects yet</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Be the first to share your vibecoded creation with the community!
      </p>
      <Link href="/submit">
        <Button className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          Submit Your Project
        </Button>
      </Link>
    </div>
  );
}
