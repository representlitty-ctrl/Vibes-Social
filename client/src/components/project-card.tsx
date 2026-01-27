import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronUp, MessageCircle, ExternalLink, Github, Sparkles, Bookmark, BookmarkCheck, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Project, User, Profile } from "@shared/schema";

type ProjectWithDetails = Project & {
  user: User & { profile: Profile | null };
  upvoteCount: number;
  commentCount: number;
  hasUpvoted: boolean;
  hasBookmarked?: boolean;
};

interface ProjectCardProps {
  project: ProjectWithDetails;
  rank?: number;
  featured?: boolean;
}

export function ProjectCard({ project, rank, featured }: ProjectCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (project.hasUpvoted) {
        return apiRequest("DELETE", `/api/projects/${project.id}/upvote`);
      }
      return apiRequest("POST", `/api/projects/${project.id}/upvote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/bookmarked"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update upvote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (project.hasBookmarked) {
        return apiRequest("DELETE", `/api/projects/${project.id}/bookmark`);
      }
      return apiRequest("POST", `/api/projects/${project.id}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/bookmarked"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    upvoteMutation.mutate();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    bookmarkMutation.mutate();
  };

  const getInitials = () => {
    if (project.user.firstName && project.user.lastName) {
      return `${project.user.firstName[0]}${project.user.lastName[0]}`.toUpperCase();
    }
    return "U";
  };

  const displayName = project.user.profile?.username 
    ? `@${project.user.profile.username}`
    : `${project.user.firstName || ""} ${project.user.lastName || ""}`.trim() || "Anonymous";

  if (featured) {
    return (
      <Link href={`/projects/${project.id}`}>
        <Card className="group relative overflow-hidden transition-all hover-elevate" data-testid={`card-project-${project.id}`}>
          {project.imageUrl && (
            <div className="aspect-video w-full overflow-hidden">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="gap-1 bg-background/80 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
          </div>
          <div className="p-4">
            <h3 className="font-semibold line-clamp-1">{project.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <Link href={`/profile/${project.userId}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 hover-elevate rounded-full pr-2 cursor-pointer">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.user.profileImageUrl || undefined} />
                    <AvatarFallback><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{displayName}</span>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  data-testid={`button-bookmark-${project.id}`}
                >
                  {project.hasBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant={project.hasUpvoted ? "default" : "outline"}
                  size="sm"
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                  className="gap-1"
                  data-testid={`button-upvote-${project.id}`}
                >
                  <ChevronUp className="h-4 w-4" />
                  {project.upvoteCount}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group flex gap-4 p-4 transition-all hover-elevate" data-testid={`card-project-${project.id}`}>
        {rank && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-muted-foreground">
            {rank}
          </div>
        )}
        
        <div className="flex flex-1 gap-4 overflow-hidden">
          {project.imageUrl && (
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
              <img
                src={project.imageUrl}
                alt={project.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="overflow-hidden">
                <h3 className="font-semibold line-clamp-1">{project.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  disabled={bookmarkMutation.isPending}
                  data-testid={`button-bookmark-${project.id}`}
                >
                  {project.hasBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant={project.hasUpvoted ? "default" : "outline"}
                  size="sm"
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                  className="flex-col gap-0 px-3 py-2 h-auto"
                  data-testid={`button-upvote-${project.id}`}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-xs font-bold">{project.upvoteCount}</span>
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/profile/${project.userId}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 hover-elevate rounded-full pr-2 cursor-pointer">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.user.profileImageUrl || undefined} />
                    <AvatarFallback><UserIcon className="h-4 w-4 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{displayName}</span>
                </div>
              </Link>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                {project.commentCount}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <span className="text-xs text-muted-foreground">
                {project.createdAt && formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
